/* MERVEIL PRO STUDIO v4 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY, AI_BASE } from './config.js';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});
const root = document.getElementById('pro-root');

const DEMO_FILES = {
  'src/App.tsx': `export default function App() {\n  return (\n    <main className="page">\n      <h1>Hello from Merveil Pro</h1>\n      <p>Edit this file — ⌘S to save, ⌘K for AI.</p>\n    </main>\n  );\n}\n`,
  'src/styles.css': `:root { --cyan: #00b8d4; }\nbody { font-family: Inter, system-ui, sans-serif; margin: 0; }\n.page { padding: 2rem; }\n`,
  'package.json': `{\n  "name": "merveil-pro-app",\n  "private": true,\n  "scripts": { "dev": "vite", "build": "vite build" }\n}\n`,
  'README.md': `# Pro Studio project\n\nBuilt with Merveil AI.\n`,
};

const state = {
  session: null,
  passport: null,
  tier: 'free',
  panel: 'explorer',
  files: { ...DEMO_FILES },
  activeTab: 'src/App.tsx',
  openTabs: ['src/App.tsx'],
  aiThread: [{ role: 'a', text: 'Pro Studio ready. Ask me to explain, refactor, or add tests for the open file.' }],
  project: null,
};

const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k === 'style') n.style.cssText = v;
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else if (v != null && v !== false) n.setAttribute(k, v);
  }
  for (const k of kids.flat()) {
    if (k == null || k === false) continue;
    n.append(k.nodeType ? k : document.createTextNode(String(k)));
  }
  return n;
};

function toast(msg) {
  const t = el('div', {
    style: 'position:fixed;bottom:34px;left:50%;transform:translateX(-50%);background:#222;color:#fff;padding:9px 16px;border-radius:999px;font-size:12.5px;font-weight:600;z-index:999',
  }, msg);
  document.body.append(t);
  setTimeout(() => t.remove(), 2400);
}

async function boot() {
  startCircuits();
  const { data: { session } } = await sb.auth.getSession();
  state.session = session;
  sb.auth.onAuthStateChange((_e, s) => { state.session = s; render(); });
  if (session) await loadIdentity();
  render();
}

async function loadIdentity() {
  const uid = state.session.user.id;
  const [{ data: profile }, { data: dev }] = await Promise.all([
    sb.from('profiles').select('id, name, junction_id, passport_tier').eq('id', uid).maybeSingle(),
    sb.from('developer_accounts').select('*').eq('owner_user_id', uid).maybeSingle(),
  ]);
  if (profile) {
    state.passport = {
      citizen_id: profile.junction_id || ('JX-' + uid.slice(0, 8).toUpperCase()),
      display_name: profile.name,
    };
  } else {
    state.passport = { citizen_id: 'JX-' + uid.slice(0, 8).toUpperCase() };
  }
  state.tier = dev?.plan_id || 'free';
}

function render() {
  root.innerHTML = '';
  if (!state.session) {
    return root.append(el('div', { class: 'gate' },
      el('div', { class: 'gate-card' },
        el('h1', {}, 'Merveil Pro Studio'),
        el('p', {}, 'Expert mode requires the same Passport as Citizen App.'),
        el('button', {
          class: 'btn-sm cyan',
          onclick: async () => {
            await sb.auth.signInWithOAuth({
              provider: 'google',
              options: { redirectTo: location.origin + '/developer/pro' },
            });
          },
        }, 'Continue with Google'),
        el('div', { style: 'margin-top:14px' },
          el('a', { href: '/developer' }, '← Back to Studio'),
        ),
      ),
    ));
  }

  root.append(el('div', { class: 'pro' },
    topBar(),
    sideBar(),
    fileTree(),
    mainPane(),
    aiPane(),
    statusBar(),
  ));
}

function topBar() {
  return el('header', { class: 'top' },
    el('div', { class: 'logo' }, el('span', { class: 'dot' }), 'Merveil Pro'),
    el('span', { class: 'pill cyan' }, state.tier.toUpperCase()),
    el('span', { class: 'pill' }, state.passport?.citizen_id || '—'),
    el('div', { class: 'sp' }),
    el('a', { class: 'btn-sm', href: '/developer' }, 'Light Studio'),
    el('a', { class: 'btn-sm', href: '/' }, 'Citizen'),
    el('button', { class: 'btn-sm cyan', onclick: () => toast('Deploy queued') }, 'Deploy'),
  );
}

function sideBar() {
  const items = [
    ['explorer', '📁 Explorer'],
    ['search', '🔍 Search'],
    ['git', '⑂ Git'],
    ['terminal', '⌘ Terminal'],
    ['integrations', '🔌 Integrations'],
  ];
  return el('aside', { class: 'side' },
    el('div', { class: 'nav' },
      ...items.map(([id, label]) =>
        el('button', {
          class: state.panel === id ? 'on' : '',
          onclick: () => { state.panel = id; render(); },
        }, label),
      ),
    ),
  );
}

function fileTree() {
  const names = Object.keys(state.files);
  return el('aside', { class: 'tree' },
    el('div', { class: 'h' }, 'Files'),
    ...names.map(name =>
      el('div', {
        class: 'f' + (state.activeTab === name ? ' on' : ''),
        onclick: () => openFile(name),
      }, el('span', { class: 'ic' }, iconFor(name)), name),
    ),
  );
}

function iconFor(name) {
  if (name.endsWith('.tsx') || name.endsWith('.ts')) return 'TS';
  if (name.endsWith('.css')) return 'CSS';
  if (name.endsWith('.json')) return '{}';
  if (name.endsWith('.md')) return 'MD';
  return '·';
}

function openFile(name) {
  state.activeTab = name;
  if (!state.openTabs.includes(name)) state.openTabs.push(name);
  render();
}

function mainPane() {
  const ed = el('div', {
    class: 'editor',
    contenteditable: 'true',
    spellcheck: 'false',
  }, state.files[state.activeTab] || '');
  ed.addEventListener('input', () => {
    state.files[state.activeTab] = ed.innerText;
  });
  return el('section', { class: 'main' },
    el('div', { class: 'tabs' },
      ...state.openTabs.map(t =>
        el('div', {
          class: 'tab' + (t === state.activeTab ? ' on' : ''),
          onclick: () => openFile(t),
        }, t.split('/').pop()),
      ),
    ),
    ed,
  );
}

function aiPane() {
  const thread = el('div', { class: 'ai-thread', id: 'ai-thread' },
    ...state.aiThread.map(m => el('div', { class: 'msg ' + (m.role === 'u' ? 'u' : 'a') }, m.text)),
  );
  return el('aside', { class: 'ai' },
    el('div', { class: 'ai-h' }, el('span', { class: 'b' }), 'Merveil AI'),
    thread,
    el('div', { class: 'ai-in' },
      el('textarea', { id: 'ai-input', placeholder: 'Ask about this file — refactor, explain, add tests…' }),
      el('div', { class: 'row' },
        el('button', { class: 'btn-sm', onclick: () => quickAI('Explain this file') }, 'Explain'),
        el('button', { class: 'btn-sm', onclick: () => quickAI('Add tests') }, 'Tests'),
        el('button', { class: 'btn-sm cyan', onclick: sendAI }, 'Send'),
      ),
    ),
  );
}

async function quickAI(q) {
  const input = document.getElementById('ai-input');
  if (input) input.value = q;
  await sendAI();
}

async function sendAI() {
  const input = document.getElementById('ai-input');
  const text = input?.value.trim();
  if (!text) return;
  state.aiThread.push({ role: 'u', text });
  if (input) input.value = '';
  render();
  scrollAI();
  try {
    const res = await fetch((AI_BASE || '') + '/v1/assist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + (state.session?.access_token || ''),
      },
      body: JSON.stringify({
        file: state.activeTab,
        content: state.files[state.activeTab],
        prompt: text,
        tier: state.tier,
      }),
    });
    const json = await res.json().catch(() => ({}));
    state.aiThread.push({ role: 'a', text: json.answer || json.error || localAssist(text) });
  } catch {
    state.aiThread.push({ role: 'a', text: localAssist(text) });
  }
  render();
  scrollAI();
}

function localAssist(text) {
  const file = state.activeTab;
  const lower = text.toLowerCase();
  if (lower.includes('explain')) {
    return `**${file}** — demo buffer in Pro Studio.\n• Edit inline, ⌘S to save locally\n• Wire AI_BASE + /v1/assist for live Claude answers\n• Deploy button is a stub until orchestrator is online`;
  }
  if (lower.includes('test')) {
    return `Suggested tests for \`${file}\`:\n1. Render smoke test\n2. Interaction handlers\n3. Snapshot for layout\n\n(Connect orchestrator for generated code.)`;
  }
  return `Got it: “${text}”.\nOpen file: ${file} (${(state.files[file] || '').split('\\n').length} lines).\nAssistant endpoint offline — showing local fallback.`;
}

function scrollAI() {
  requestAnimationFrame(() => {
    const t = document.getElementById('ai-thread');
    if (t) t.scrollTop = t.scrollHeight;
  });
}

function statusBar() {
  const lines = (state.files[state.activeTab] || '').split('\n').length;
  return el('footer', { class: 'status' },
    el('span', {}, el('span', { class: 'dot' }), 'Connected'),
    el('span', {}, state.activeTab || '—'),
    el('span', {}, 'Ln ' + lines),
    el('span', { class: 'sp' }),
    el('span', {}, 'UTF-8'),
    el('span', { class: 'badge' }, state.tier.toUpperCase()),
    el('span', {}, state.passport?.citizen_id || ''),
  );
}

function startCircuits() {
  const c = document.getElementById('circuits');
  if (!c) return;
  const ctx = c.getContext('2d');
  const resize = () => { c.width = innerWidth; c.height = innerHeight; };
  resize();
  addEventListener('resize', resize);
  const nodes = Array.from({ length: 28 }, () => ({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
  }));
  const tick = () => {
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.strokeStyle = 'rgba(0,184,212,0.25)';
    ctx.fillStyle = 'rgba(0,184,212,0.7)';
    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > c.width) n.vx *= -1;
      if (n.y < 0 || n.y > c.height) n.vy *= -1;
      ctx.beginPath(); ctx.arc(n.x, n.y, 1.6, 0, Math.PI * 2); ctx.fill();
    }
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 140) {
          ctx.globalAlpha = 1 - d / 140;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }
    requestAnimationFrame(tick);
  };
  tick();
}

window.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); toast('Saved locally'); }
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('ai-input')?.focus();
  }
});

boot();
