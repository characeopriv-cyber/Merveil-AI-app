import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY, AI_BASE } from './config.js';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true } });
const root = document.getElementById('root');
const el = (t, a = {}, ...c) => {
  const n = document.createElement(t);
  for (const [k, v] of Object.entries(a)) {
    if (k === 'class') n.className = v;
    else if (k === 'style') n.style.cssText = v;
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else if (v != null) n.setAttribute(k, v);
  }
  for (const x of c.flat()) if (x != null) n.append(x.nodeType ? x : document.createTextNode(String(x)));
  return n;
};

const state = { session: null, agent: null, sessionId: null, messages: [], busy: false };

async function boot() {
  const { data: { session } } = await sb.auth.getSession();
  state.session = session;
  if (!session) {
    root.append(el('div', { class: 'ag-root' }, el('p', {}, 'Sign in via Studio first.'), el('a', { href: '/developer' }, 'Studio')));
    return;
  }
  await ensureAgent();
  render();
}

async function ensureAgent() {
  const uid = state.session.user.id;
  let { data: list } = await sb.from('agents').select('*').eq('owner_user_id', uid).limit(1);
  if (!list?.length) {
    const slug = 'agent-' + Math.random().toString(36).slice(2, 8);
    const { data: agent } = await sb.from('agents').insert({
      owner_user_id: uid, slug, name: 'My first agent', status: 'draft', visibility: 'private',
    }).select().single();
    const spec = {
      name: 'My first agent',
      model: { provider: 'anthropic', name: 'claude-sonnet-4-5', temperature: 0.3, max_tokens: 1024 },
      prompt: { system: 'You are a helpful Merveil agent. Be concise and practical.', input_variables: [] },
      tools: [],
      memory: { short_term: { window: 20 }, long_term: { enabled: false } },
      guardrails: { max_steps: 8, max_credits: 50, max_seconds: 60 },
    };
    const { data: ver } = await sb.from('agent_versions').insert({
      agent_id: agent.id, version: 1, spec, created_by: uid,
    }).select().single();
    await sb.from('agents').update({ current_version_id: ver.id }).eq('id', agent.id);
    state.agent = { ...agent, current_version_id: ver.id };
  } else {
    state.agent = list[0];
  }
}

function render() {
  root.innerHTML = '';
  root.append(el('div', { class: 'ag-root' },
    el('div', { style: 'display:flex;gap:12px;align-items:center;margin-bottom:14px;flex-wrap:wrap' },
      el('a', { href: '/developer' }, '← Studio'),
      el('h1', { style: 'font-family:Instrument Serif,serif;font-weight:400;font-size:24px;margin:0' }, state.agent?.name || 'Agent'),
      el('span', { style: 'font-size:12px;color:var(--ink-3)' }, state.agent?.status || ''),
      el('div', { style: 'flex:1' }),
      el('a', { class: 'btn ghost sm', href: '/developer/workflows' }, 'Workflows'),
    ),
    el('div', { class: 'ag-chat' },
      el('div', { class: 'ag-body', id: 'chat' },
        ...state.messages.map(m => el('div', { class: 'ag-bub ' + (m.role === 'user' ? 'u' : 'a') }, m.content)),
        state.messages.length ? null : el('div', { style: 'text-align:center;color:var(--ink-3);padding:40px' }, 'Say hello to your agent'),
      ),
      el('div', { class: 'ag-in' },
        el('input', {
          id: 'msg', placeholder: 'Message…',
          onkeydown: (e) => { if (e.key === 'Enter') send(); },
        }),
        el('button', {
          class: 'btn sm', 'data-c': 'voice', disabled: state.busy ? 'true' : null,
          onclick: send,
        }, state.busy ? '…' : 'Send'),
      ),
    ),
  ));
}

async function send() {
  const input = document.getElementById('msg');
  const text = input?.value?.trim();
  if (!text || state.busy) return;
  input.value = '';
  state.messages.push({ role: 'user', content: text });
  state.busy = true;
  render();
  try {
    const res = await fetch((AI_BASE || '') + '/v1/agents/invoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + state.session.access_token,
      },
      body: JSON.stringify({
        agent_id: state.agent.id,
        session_id: state.sessionId,
        message: text,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.detail || json.error || res.statusText);
    state.sessionId = json.session_id || state.sessionId;
    state.messages.push({ role: 'assistant', content: json.output || JSON.stringify(json) });
  } catch (e) {
    state.messages.push({ role: 'assistant', content: 'Runtime offline or error: ' + e.message + '\nDeploy agent-runtime and set AI_BASE.' });
  }
  state.busy = false;
  render();
}

boot();
