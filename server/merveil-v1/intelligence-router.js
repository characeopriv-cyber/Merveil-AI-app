const DEFAULT_SYSTEM = `You are Merveil AI, the intelligence layer beyond interaction. Give useful, clear, context-aware answers. When the request belongs to a specialized Merveil capability, reason in that domain while keeping the developer experience consistent.`;

function cleanBase(url) {
  return String(url || '').replace(/\/$/, '');
}

function providers() {
  const order = String(process.env.MERVEIL_AI_PROVIDER_ORDER || 'xai,anthropic,openai')
    .split(',').map(v => v.trim().toLowerCase()).filter(Boolean);
  return order.map(name => ({
    name,
    baseUrl: cleanBase(process.env[`MERVEIL_${name.toUpperCase()}_API_URL`] || process.env[`${name.toUpperCase()}_API_URL`] || (name === 'xai' ? process.env.AI_API_URL || process.env.XAI_API_URL : '')),
    apiKey: process.env[`MERVEIL_${name.toUpperCase()}_API_KEY`] || process.env[`${name.toUpperCase()}_API_KEY`] || (name === 'xai' ? process.env.AI_API_KEY || process.env.XAI_API_KEY : ''),
    model: process.env[`MERVEIL_${name.toUpperCase()}_MODEL`] || process.env[`${name.toUpperCase()}_MODEL`] || (name === 'xai' ? process.env.AI_MODEL || process.env.XAI_MODEL || 'grok-2-latest' : '')
  })).filter(p => p.baseUrl && p.apiKey && p.model);
}

async function callOpenAICompatible(provider, messages, options) {
  const url = provider.baseUrl.includes('/chat/completions') ? provider.baseUrl : `${provider.baseUrl}/chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.apiKey}` },
    body: JSON.stringify({ model: provider.model, messages, max_tokens: options.maxTokens, temperature: options.temperature })
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`upstream_${response.status}`);
  let data; try { data = JSON.parse(text); } catch { data = { reply: text }; }
  return String(data?.choices?.[0]?.message?.content || data?.reply || data?.content || data?.message || '').trim();
}

async function callAnthropic(provider, messages, options) {
  const url = provider.baseUrl.includes('/messages') ? provider.baseUrl : `${provider.baseUrl}/v1/messages`;
  const system = messages.find(m => m.role === 'system')?.content || DEFAULT_SYSTEM;
  const input = messages.filter(m => m.role !== 'system');
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': provider.apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: provider.model, system, messages: input, max_tokens: options.maxTokens, temperature: options.temperature })
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`upstream_${response.status}`);
  let data; try { data = JSON.parse(text); } catch { data = {}; }
  return String(data?.content?.filter(x => x?.type === 'text').map(x => x.text).join('') || data?.content?.[0]?.text || '').trim();
}

export async function generate({ messages = [], maxTokens = 800, temperature = 0.7 }) {
  const normalized = [{ role: 'system', content: DEFAULT_SYSTEM }, ...messages.filter(m => m?.role && m?.content)];
  const options = { maxTokens: Math.min(Number(maxTokens) || 800, 2048), temperature: Number.isFinite(Number(temperature)) ? Number(temperature) : 0.7 };
  const attempted = [];
  for (const provider of providers()) {
    try {
      const reply = provider.name === 'anthropic'
        ? await callAnthropic(provider, normalized, options)
        : await callOpenAICompatible(provider, normalized, options);
      if (reply) return { reply, provider: provider.name, model: provider.model, attempted };
      attempted.push(`${provider.name}:empty`);
    } catch (error) {
      attempted.push(`${provider.name}:failed`);
    }
  }
  const error = new Error('No configured Merveil AI provider succeeded');
  error.attempted = attempted;
  throw error;
}

export function intelligenceCatalog() {
  return {
    routing: 'automatic',
    provider_hidden: true,
    fallback: true,
    principle: 'Developers integrate once with Merveil; Merveil selects the configured intelligence provider underneath.'
  };
}
