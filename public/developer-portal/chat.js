/** POST /api/studio/chat — Pro Studio AI panel stream/proxy */
export const config = { runtime: 'edge' };

const SYSTEM = `You are Merveil AI — an elite engineer inside the IDE.
When you propose code, use a fenced block with the file path as the language tag:
\`\`\`src/App.tsx
...full file content...
\`\`\`
Emit FULL file content when editing. Keep responses tight.`;

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors() });
  }
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }
  const body = await req.json().catch(() => ({}));
  const { mode = 'chat', message, activeFile, openFiles } = body;
  if (!message) return json({ error: 'message_required' }, 400);

  const context = [];
  if (activeFile?.path) {
    context.push(`ACTIVE FILE: ${activeFile.path}\n\`\`\`\n${String(activeFile.content || '').slice(0, 8000)}\n\`\`\``);
  }
  if (openFiles?.length) {
    context.push(`OPEN FILES: ${openFiles.map((f) => f.path).join(', ')}`);
  }
  const userMsg = `${context.join('\n\n')}\n\nMODE: ${mode}\n\nUSER: ${message}`;

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    // deterministic helpful stub
    const path = activeFile?.path || 'src/App.tsx';
    const stub = `Here is an updated file.\n\n\`\`\`${path}\n${(activeFile?.content || '// empty').slice(0, 500)}\n// TODO: ${message}\n\`\`\`\n`;
    return new Response(stub, { headers: { ...cors(), 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 8192,
      stream: true,
      system: SYSTEM,
      messages: [{ role: 'user', content: userMsg }],
    }),
  });

  if (!res.ok || !res.body) {
    const t = await res.text();
    return json({ error: 'anthropic_failed', detail: t.slice(0, 400) }, 502);
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
            } catch { /* */ }
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

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, authorization',
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors(), 'content-type': 'application/json' },
  });
}
