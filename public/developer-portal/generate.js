/**
 * POST /api/engine/generate
 * Streams model tokens for the Build Engine MF protocol.
 * Requires ANTHROPIC_API_KEY (or OPENAI_API_KEY fallback).
 */
export const config = { runtime: 'edge' };

const SYSTEM = `You are Merveil AI — a full-stack engineer.
Emit files in this exact protocol. No prose outside the protocol.

<MF:BEGIN>
path: package.json
<MF:BYTES>
{ ... }
<MF:END>

Rules:
- Vite + React + TypeScript unless the mode says otherwise.
- Required for web_app: package.json, index.html, src/main.tsx, src/App.tsx
- package.json must include "scripts": { "dev": "vite --host 0.0.0.0" }
- Every file under 300 lines.
- Emit in dependency order.
- Never include markdown fences or explanations.`;

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: cors(),
    });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { ...cors(), 'content-type': 'application/json' },
    });
  }

  const { prompt, mode = 'web_app', system } = await req.json().catch(() => ({}));
  if (!prompt) {
    return new Response(JSON.stringify({ error: 'prompt_required' }), {
      status: 400,
      headers: { ...cors(), 'content-type': 'application/json' },
    });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (anthropicKey) {
    return streamAnthropic(anthropicKey, system || SYSTEM, mode, prompt);
  }
  if (openaiKey) {
    return streamOpenAI(openaiKey, system || SYSTEM, mode, prompt);
  }

  // Deterministic stub so local Studio can still exercise the parser
  const stub = stubProject(mode, prompt);
  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      controller.enqueue(enc.encode(stub));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      ...cors(),
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, authorization',
  };
}

async function streamAnthropic(key, system, mode, prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 16000,
      stream: true,
      system,
      messages: [{ role: 'user', content: `MODE: ${mode}\n\nIDEA: ${prompt}` }],
    }),
  });

  if (!res.ok || !res.body) {
    const t = await res.text();
    return new Response(JSON.stringify({ error: 'anthropic_failed', detail: t.slice(0, 500) }), {
      status: 502,
      headers: { ...cors(), 'content-type': 'application/json' },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() || '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (!data || data === '[DONE]') continue;
            try {
              const j = JSON.parse(data);
              if (j.type === 'content_block_delta' && j.delta?.text) {
                controller.enqueue(enc.encode(j.delta.text));
              }
            } catch { /* skip */ }
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...cors(),
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}

async function streamOpenAI(key, system, mode, prompt) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      stream: true,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `MODE: ${mode}\n\nIDEA: ${prompt}` },
      ],
    }),
  });
  if (!res.ok || !res.body) {
    return new Response(JSON.stringify({ error: 'openai_failed' }), {
      status: 502,
      headers: { ...cors(), 'content-type': 'application/json' },
    });
  }
  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() || '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (!data || data === '[DONE]') continue;
            try {
              const j = JSON.parse(data);
              const t = j.choices?.[0]?.delta?.content;
              if (t) controller.enqueue(enc.encode(t));
            } catch { /* skip */ }
          }
        }
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      ...cors(),
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}

function stubProject(mode, prompt) {
  const title = String(prompt || 'Merveil App').slice(0, 40).replace(/[<>]/g, '');
  return [
    '<MF:BEGIN>',
    'path: package.json',
    '<MF:BYTES>',
    JSON.stringify({
      name: 'merveil-app',
      private: true,
      type: 'module',
      scripts: { dev: 'vite --host 0.0.0.0', build: 'vite build' },
      dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
      devDependencies: { vite: '^5.4.0', '@vitejs/plugin-react': '^4.3.1' },
    }, null, 2),
    '<MF:END>',
    '<MF:BEGIN>',
    'path: index.html',
    '<MF:BYTES>',
    `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`,
    '<MF:END>',
    '<MF:BEGIN>',
    'path: src/main.tsx',
    '<MF:BYTES>',
    `import React from 'react';\nimport { createRoot } from 'react-dom/client';\nimport App from './App';\ncreateRoot(document.getElementById('root')!).render(<App />);\n`,
    '<MF:END>',
    '<MF:BEGIN>',
    'path: src/App.tsx',
    '<MF:BYTES>',
    `export default function App() {\n  return (\n    <main style={{ fontFamily: 'system-ui', padding: 24 }}>\n      <h1>${title}</h1>\n      <p>Mode: ${mode}. Generated offline stub — set ANTHROPIC_API_KEY for live builds.</p>\n    </main>\n  );\n}\n`,
    '<MF:END>',
  ].join('\n');
}
