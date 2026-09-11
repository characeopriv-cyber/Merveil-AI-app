/**
 * Merveil Studio — dense Home → Build workspace
 * Wire: /api/engine/generate (MF stream) + local VFS state
 */
import { SUPABASE_URL, SUPABASE_ANON_KEY, API_BASE } from './config.js';

const MODES = ['Website', 'Web app', 'Mobile', 'AI agent', 'Game', 'Video', 'Music', 'Book'];
const KIND_MAP = {
  Website: 'website', 'Web app': 'web_app', Mobile: 'mobile_app',
  'AI agent': 'ai_agent', Game: 'game_3d', Video: 'video', Music: 'music', Book: 'book',
};
const SHOWCASE = [
  { name: 'Shade Finder', tag: 'Mobile · iOS', bg: '#e8e3d8', fg: '#0a0a0a' },
  { name: 'Riad Booking', tag: 'Web app', bg: '#ffd9c4', fg: '#1a1005' },
  { name: 'Choose Time', tag: 'Scheduling', bg: '#a4d8c4', fg: '#042a1e' },
  { name: 'Lead Qualifier', tag: 'AI agent', bg: '#d8e0ff', fg: '#0a1030' },
  { name: 'Kitchen Studio', tag: 'Interior', bg: '#f0e6d2', fg: '#2a1f08' },
  { name: 'Field Notes', tag: 'Book', bg: '#c8d5d8', fg: '#0a1a1f' },
  { name: 'Pulse Tracker', tag: 'Game · 2D', bg: '#f4c8d8', fg: '#2a0818' },
  { name: 'Lofi Studio', tag: 'Music', bg: '#d4c8f4', fg: '#180a2a' },
];
const FEATURES = [
  ['01', 'Backend already done', 'Auth, database, storage, realtime, and permissions on every project.'],
  ['02', 'Frontend that ships', 'React + TypeScript. Real code you can eject to GitHub anytime.'],
  ['03', 'Deploy in one click', 'Vercel, Cloudflare, or Merveil Edge. Live URL in seconds.'],
  ['04', '60+ integrations', 'Stripe, GitHub, Supabase, OpenAI, Resend, Twilio — connect once.'],
  ['05', 'Wallet-native billing', 'Same wallet as Citizen. M-Pesa, card, UPI, SEPA.'],
  ['06', 'Publish to Interface', 'List to Citizens. 80% revenue share, instant payouts.'],
];
const SECTIONS = [
  ['pages', 'Pages'], ['search', 'Search'], ['data', 'Data'], ['design', 'Design'],
  ['integrations', 'Integrations'], ['git', 'History'], ['deploy', 'Publish'], ['settings', 'Settings'],
];

const state = {
  screen: 'home', // home | build
  mode: 'Web app',
  prompt: '',
  plan: false,
  focused: false,
  passport: null,
  projectName: 'untitled-app',
  section: 'pages',
  panelOpen: true,
  aiOpen: true,
  device: 'desktop',
  buildState: 'idle', // idle | planning | generating | building | ready | failed
  files: /** @type {Array<{path:string,content:string,bytes:number}>} */ ([]),
  messages: /** @type {Array<{role:string,text:string,files?:string[]}>} */ ([]),
  previewUrl: null,
  events: [],
  searchQ: '',
  primary: '#00b8d4',
  accent: '#ff5a1f',
  editingName: false,
};

const root = document.getElementById('root');

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function loadPassport() {
  try {
    const raw = localStorage.getItem('junction_user') || localStorage.getItem('merveil_user');
    if (raw) state.passport = JSON.parse(raw);
  } catch { /* ignore */ }
  if (!state.passport?.citizen_id) {
    state.passport = { citizen_id: 'visitor', display_name: 'Visitor' };
  }
}

function render() {
  if (!root) return;
  root.innerHTML = '';
  if (state.screen === 'home') root.appendChild(renderHome());
  else root.appendChild(renderStudio());
  bindGlobal();
}

/* ══════════ HOME ══════════ */
function renderHome() {
  const pp = state.passport?.citizen_id || 'no passport';
  const home = el(`<div class="home"></div>`);
  home.appendChild(el(`
    <header class="nav">
      <a class="nav-logo" href="/developer"><span class="nav-logo-mark">M</span><span>Merveil</span></a>
      <nav class="nav-links">
        <a href="/developer/showcase">Showcase</a>
        <a href="/developer/docs">Docs</a>
        <a href="/developer/pricing">Pricing</a>
        <a href="/developer/agents">Agents</a>
      </nav>
      <div class="nav-right">
        <span class="nav-passport"><span class="pp-dot"></span>${esc(pp)}</span>
        <a class="nav-cta" href="/developer/pro">Open Studio</a>
      </div>
    </header>
  `));

  const hero = el(`<section class="hero"></section>`);
  hero.innerHTML = `
    <div class="hero-eyebrow"><span class="eyebrow-dot"></span>Merveil Engine · v5 · ${esc(pp)}</div>
    <h1 class="hero-title">Describe it. Ship it.</h1>
    <p class="hero-sub">Merveil builds the frontend, the backend, the database, the auth, and the deploy. Everything in one prompt.</p>
  `;
  const composer = el(`<div class="composer ${state.focused ? 'focused' : ''}"></div>`);
  composer.innerHTML = `
    <div class="composer-modes">
      ${MODES.map((m) => `<button type="button" class="mode ${state.mode === m ? 'on' : ''}" data-mode="${esc(m)}">${esc(m)}</button>`).join('')}
    </div>
    <div class="composer-body">
      <textarea id="home-prompt" rows="2" placeholder="Build an interior design platform for floor plans, material specs, and project documentation…">${esc(state.prompt)}</textarea>
      <div class="composer-tools">
        <button type="button" class="tool-icon" title="Attach" data-act="attach">+</button>
        <button type="button" class="tool-plan ${state.plan ? 'on' : ''}" data-act="plan">Plan <span class="switch ${state.plan ? 'on' : ''}"><span></span></span></button>
        <div class="tool-sep"></div>
        <button type="button" class="tool-icon" title="Voice" data-act="voice">◉</button>
        <button type="button" class="tool-submit" data-act="ignite" ${state.prompt.trim().length < 3 ? 'disabled' : ''} title="⌘↵">→</button>
      </div>
    </div>
  `;
  hero.appendChild(composer);
  hero.appendChild(el(`
    <div class="hero-trust">
      <div class="trust-pill"><div><div class="trust-t">App Store</div><div class="trust-s">iOS ready</div></div></div>
      <div class="trust-pill"><div><div class="trust-t">Google Play</div><div class="trust-s">Android ready</div></div></div>
      <div class="trust-pill"><div><div class="trust-t">Edge deploy</div><div class="trust-s">in ~4 seconds</div></div></div>
    </div>
  `));
  home.appendChild(hero);

  const rail = el(`<section class="rail-section"></section>`);
  rail.innerHTML = `
    <div class="rail-head"><h2>Built this week on Merveil</h2><a class="rail-link" href="/developer/showcase">See all →</a></div>
    <div class="rail-scroll">
      ${SHOWCASE.map((s) => `
        <div class="shot">
          <div class="shot-frame" style="background:${s.bg};color:${s.fg}">
            <div class="shot-mock">
              <div class="shot-bar" style="width:40%"></div>
              <div class="shot-bar" style="width:70%"></div>
              <div class="shot-block"></div>
              <div class="shot-bar" style="width:55%"></div>
              <div class="shot-bar" style="width:80%"></div>
            </div>
          </div>
          <div class="shot-meta"><span class="shot-name">${esc(s.name)}</span><span class="shot-tag">${esc(s.tag)}</span></div>
        </div>`).join('')}
    </div>
  `;
  home.appendChild(rail);

  const grid = el(`<section class="grid-3"></section>`);
  grid.innerHTML = FEATURES.map(([n, t, d]) => `
    <div class="feature"><div class="feature-n">${n}</div><div class="feature-t">${esc(t)}</div><div class="feature-d">${esc(d)}</div></div>
  `).join('');
  home.appendChild(grid);

  home.appendChild(el(`
    <section class="strip">
      <div class="strip-row"><span class="strip-label">Stacks</span><div class="strip-list">${['React','Next.js','Astro','Expo','Phaser','Remotion'].map((s)=>`<span class="chip">${s}</span>`).join('')}</div></div>
      <div class="strip-row"><span class="strip-label">Models</span><div class="strip-list">${['Claude Sonnet 4.5','GPT-4o','Gemini 2.0','Llama 3.3'].map((s)=>`<span class="chip">${s}</span>`).join('')}</div></div>
      <div class="strip-row"><span class="strip-label">Integrations</span><div class="strip-list">${['GitHub','Vercel','Supabase','Stripe','OpenAI','Anthropic','Resend','Twilio'].map((s)=>`<span class="chip">${s}</span>`).join('')}</div></div>
    </section>
  `));

  home.appendChild(el(`
    <footer class="foot">
      <div class="foot-cols">
        <div><div class="foot-brand">Merveil Engine</div><div class="foot-sub">Part of the Merveil ecosystem</div></div>
        <div><div class="foot-h">Product</div><a href="/developer">Studio</a><a href="/developer/pro">Pro Studio</a><a href="/developer/agents">Agents</a></div>
        <div><div class="foot-h">Developers</div><a href="/developer/docs">Docs</a><a href="/developer/pricing">Pricing</a></div>
        <div><div class="foot-h">Company</div><a href="/">Junction</a></div>
      </div>
      <div class="foot-base"><span>© ${new Date().getFullYear()} Merveil · Junction Technology</span><span>Built on the Merveil Engine</span></div>
    </footer>
  `));

  // binds
  home.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => {
    state.mode = b.getAttribute('data-mode');
    render();
  }));
  const ta = home.querySelector('#home-prompt');
  ta?.addEventListener('input', () => {
    state.prompt = ta.value;
    const btn = home.querySelector('[data-act="ignite"]');
    if (btn) btn.disabled = state.prompt.trim().length < 3;
    ta.style.height = '0';
    ta.style.height = Math.min(ta.scrollHeight, 220) + 'px';
  });
  ta?.addEventListener('focus', () => { state.focused = true; home.querySelector('.composer')?.classList.add('focused'); });
  ta?.addEventListener('blur', () => { state.focused = false; home.querySelector('.composer')?.classList.remove('focused'); });
  home.querySelector('[data-act="plan"]')?.addEventListener('click', () => { state.plan = !state.plan; render(); });
  home.querySelector('[data-act="ignite"]')?.addEventListener('click', () => ignite());
  home.querySelector('[data-act="voice"]')?.addEventListener('click', () => startVoice(ta));

  return home;
}

/* ══════════ BUILD WORKSPACE ══════════ */
function stageCls(i) {
  const map = { idle: -1, planning: 0, generating: 1, building: 2, ready: 3, failed: -1 };
  const cur = map[state.buildState] ?? -1;
  if (state.buildState === 'ready') return 'done';
  if (cur > i) return 'done';
  if (cur === i) return 'active';
  return '';
}

function renderStudio() {
  const cls = `studio ${state.panelOpen ? '' : 'no-panel'} ${state.aiOpen ? '' : 'no-ai'}`.trim();
  const wrap = el(`<div class="${cls}"></div>`);

  wrap.appendChild(el(`
    <header class="topbar">
      <div class="tb-left">
        <button type="button" class="tb-icon" data-act="toggle-panel" title="Panel">☰</button>
        <div class="tb-brand"><div class="tb-brand-mark"></div><span>Merveil</span></div>
      </div>
      <div class="tb-center">
        ${state.editingName
          ? `<input class="tb-name-input" id="proj-name" value="${esc(state.projectName)}" />`
          : `<button type="button" class="tb-name" data-act="edit-name">${esc(state.projectName)}</button>`}
        <span class="tb-pp"><span class="tb-pp-dot"></span>${esc(state.passport?.citizen_id || '—')}</span>
      </div>
      <div class="tb-right">
        <div class="tb-stages">
          ${['plan','gen','build','live'].map((s, i) => `
            <div class="tb-stage ${stageCls(i)}"><span class="tb-stage-dot"></span><span>${s}</span></div>
          `).join('')}
        </div>
        <button type="button" class="tb-btn ghost" data-act="deploy" ${!state.previewUrl ? 'disabled' : ''}>Deploy</button>
        <button type="button" class="tb-icon" data-act="toggle-ai" title="AI">✦</button>
        <a class="tb-btn" href="/developer" data-act="home">Home</a>
      </div>
    </header>
  `));

  const rail = el(`<nav class="rail"></nav>`);
  SECTIONS.forEach(([id, label]) => {
    const b = el(`<button type="button" class="rail-btn ${state.section === id ? 'on' : ''}" data-section="${id}" title="${label}"><span>${label.slice(0,1)}</span><span class="rail-label">${label}</span></button>`);
    b.addEventListener('click', () => { state.section = id; state.panelOpen = true; render(); });
    rail.appendChild(b);
  });
  wrap.appendChild(rail);

  if (state.panelOpen) wrap.appendChild(renderPanel());
  wrap.appendChild(renderPreview());
  if (state.aiOpen) wrap.appendChild(renderAI());

  const stCls = state.buildState === 'ready' ? 'ok' : (state.buildState === 'idle' ? '' : 'busy');
  wrap.appendChild(el(`
    <footer class="status ${stCls}">
      <span><span class="status-dot"></span> ${esc(state.buildState)}</span>
      <span>${state.files.length} files</span>
      <div class="status-right">
        <span>${esc(state.mode)}</span>
        <span>${esc(state.passport?.citizen_id || '')}</span>
      </div>
    </footer>
  `));

  wrap.querySelector('[data-act="toggle-panel"]')?.addEventListener('click', () => { state.panelOpen = !state.panelOpen; render(); });
  wrap.querySelector('[data-act="toggle-ai"]')?.addEventListener('click', () => { state.aiOpen = !state.aiOpen; render(); });
  wrap.querySelector('[data-act="edit-name"]')?.addEventListener('click', () => { state.editingName = true; render(); });
  wrap.querySelector('#proj-name')?.addEventListener('blur', (e) => {
    state.projectName = e.target.value.trim() || 'untitled-app';
    state.editingName = false;
    render();
  });
  wrap.querySelector('#proj-name')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') e.target.blur();
  });
  wrap.querySelector('[data-act="deploy"]')?.addEventListener('click', () => {
    state.messages.push({ role: 'bot', text: 'Deploy: connect Vercel token in Settings, then publish from Deploy panel.' });
    render();
  });
  wrap.querySelector('[data-act="home"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    state.screen = 'home';
    history.replaceState({ screen: 'home' }, '', '/developer');
    render();
  });

  return wrap;
}

function renderPanel() {
  const panel = el(`<aside class="panel"></aside>`);
  const title = SECTIONS.find((s) => s[0] === state.section)?.[1] || state.section;
  panel.appendChild(el(`<div class="panel-head"><span class="panel-title">${esc(title)}</span></div>`));

  if (state.section === 'pages') {
    const pages = state.files.filter((f) => /App\.(tsx|jsx|js)$|pages\//.test(f.path));
    const comps = state.files.filter((f) => /components\//.test(f.path));
    panel.appendChild(el(`
      <div class="panel-body">
        <div class="group"><div class="group-head">Pages <span class="group-count">${pages.length}</span></div>
          ${pages.length ? pages.map((p) => `<div class="row"><span class="row-ico">◆</span><span class="row-name">${esc(p.path.split('/').pop())}</span></div>`).join('') : '<div class="empty-line">No pages yet</div>'}
        </div>
        <div class="group"><div class="group-head">Files <span class="group-count">${state.files.length}</span></div>
          ${state.files.slice(0, 40).map((p) => `<div class="row"><span class="row-ico">▸</span><span class="row-name">${esc(p.path)}</span><span class="row-path">${p.bytes}b</span></div>`).join('') || '<div class="empty-line">Waiting for generate…</div>'}
        </div>
      </div>
    `));
  } else if (state.section === 'search') {
    const q = state.searchQ.toLowerCase();
    const hits = q ? state.files.filter((f) => f.path.toLowerCase().includes(q)).slice(0, 40) : [];
    const body = el(`<div></div>`);
    body.innerHTML = `
      <div class="panel-search"><input id="panel-search" placeholder="Search files…" value="${esc(state.searchQ)}" /></div>
      <div class="panel-body">${hits.map((f) => `<div class="row"><span class="row-name">${esc(f.path)}</span></div>`).join('') || (q ? '<div class="empty-line">No matches</div>' : '<div class="empty-line">Type to search</div>')}</div>
    `;
    body.querySelector('#panel-search')?.addEventListener('input', (e) => {
      state.searchQ = e.target.value;
      render();
    });
    panel.appendChild(body);
  } else if (state.section === 'design') {
    panel.appendChild(el(`
      <div class="panel-body">
        <div class="group"><div class="group-head">Primary</div>
          <div class="row"><input type="color" id="c-primary" value="${state.primary}" /><span class="row-path">${state.primary}</span></div>
        </div>
        <div class="group"><div class="group-head">Accent</div>
          <div class="row"><input type="color" id="c-accent" value="${state.accent}" /><span class="row-path">${state.accent}</span></div>
        </div>
        <div class="empty-line">Colors apply to the live preview when available.</div>
      </div>
    `));
    panel.querySelector('#c-primary')?.addEventListener('input', (e) => { state.primary = e.target.value; applyDesign(); });
    panel.querySelector('#c-accent')?.addEventListener('input', (e) => { state.accent = e.target.value; applyDesign(); });
  } else if (state.section === 'data') {
    panel.appendChild(el(`
      <div class="panel-body">
        <div class="empty-line">Backend built in. Postgres + RLS ready.</div>
        ${['users','posts','comments'].map((n) => `<div class="row"><span class="row-ico">▣</span><span class="row-name">${n}</span></div>`).join('')}
      </div>
    `));
  } else if (state.section === 'integrations') {
    const items = [
      ['Supabase', true], ['Stripe', false], ['GitHub', false], ['OpenAI', false], ['Anthropic', true], ['Resend', false],
    ];
    panel.appendChild(el(`
      <div class="panel-body">
        ${items.map(([n, on]) => `<div class="row"><span class="row-name">${n}</span><span class="row-path">${on ? 'on' : 'off'}</span></div>`).join('')}
      </div>
    `));
  } else if (state.section === 'git') {
    panel.appendChild(el(`
      <div class="panel-body">
        ${state.events.slice(-20).reverse().map((e) => `<div class="row"><span class="row-name">${esc(e.type || e)}</span></div>`).join('') || '<div class="empty-line">No versions yet</div>'}
      </div>
    `));
  } else if (state.section === 'deploy') {
    panel.appendChild(el(`
      <div class="panel-body">
        <div class="empty-line">Provider: Vercel</div>
        <button type="button" class="tb-btn primary" style="width:100%;margin-top:8px" data-act="deploy-now">Publish</button>
      </div>
    `));
    panel.querySelector('[data-act="deploy-now"]')?.addEventListener('click', () => {
      state.messages.push({ role: 'bot', text: 'Publish requires a linked Vercel token. Use Pro Studio for GitHub deploy.' });
      render();
    });
  } else {
    panel.appendChild(el(`<div class="panel-body"><div class="empty-line">Project settings</div></div>`));
  }
  return panel;
}

function renderPreview() {
  const w = state.device === 'mobile' ? '390px' : state.device === 'tablet' ? '834px' : '100%';
  const wrap = el(`<div class="preview-wrap"></div>`);
  wrap.innerHTML = `
    <div class="preview-toolbar">
      <div class="url-bar"><span>🔒</span><span class="url-text">${esc(state.previewUrl || 'initializing…')}</span></div>
      <div class="device-switch">
        <button type="button" class="${state.device === 'desktop' ? 'on' : ''}" data-device="desktop">D</button>
        <button type="button" class="${state.device === 'tablet' ? 'on' : ''}" data-device="tablet">T</button>
        <button type="button" class="${state.device === 'mobile' ? 'on' : ''}" data-device="mobile">M</button>
      </div>
    </div>
    <div class="preview-stage">
      ${state.previewUrl
        ? `<div class="preview-frame-outer" style="width:${w}"><iframe class="preview-frame" src="${esc(state.previewUrl)}" title="preview"></iframe></div>`
        : `<div class="preview-loading">
            ${[['Plan', 'planning'], ['Generate', 'generating'], ['Build', 'building'], ['Live', 'ready']].map(([label, key], i) => {
              const done = stageCls(i) === 'done';
              const active = stageCls(i) === 'active';
              return `<div class="pls-step ${done ? 'done' : ''} ${active ? 'active' : ''}">
                <div class="pls-dot">${done ? '✓' : i + 1}</div>
                <div><div class="pls-title">${label}</div><div class="pls-desc">${key}</div></div>
              </div>`;
            }).join('')}
          </div>`}
    </div>
  `;
  wrap.querySelectorAll('[data-device]').forEach((b) => b.addEventListener('click', () => {
    state.device = b.getAttribute('data-device');
    render();
  }));
  return wrap;
}

function renderAI() {
  const ai = el(`<aside class="ai"></aside>`);
  ai.innerHTML = `
    <div class="ai-head"><span class="ai-orb"></span><span class="ai-head-title">Merveil AI</span></div>
    <div class="ai-feed" id="ai-feed">
      ${state.messages.length === 0 ? `
        <div class="ai-empty">
          <h3>What should we change?</h3>
          <p>Evolve the app, or start from Home with a new idea.</p>
          <button type="button" class="ai-preset" data-preset="Add dark mode">Add dark mode</button>
          <button type="button" class="ai-preset" data-preset="Make it mobile-first">Make it mobile-first</button>
          <button type="button" class="ai-preset" data-preset="Add a pricing page">Add a pricing page</button>
        </div>` : state.messages.map((m) => `
          <div class="ai-msg">
            <div class="ai-msg-who ${m.role === 'bot' ? 'bot' : ''}">${m.role === 'bot' ? 'Merveil' : 'You'}</div>
            <div class="ai-msg-body">${esc(m.text)}</div>
            ${(m.files || []).map((f) => `<div class="ai-file">${esc(f)}</div>`).join('')}
          </div>`).join('')}
    </div>
    <div class="ai-in">
      <div class="ai-in-chips">
        <button type="button" class="ai-chip" data-preset="Add auth">Add auth</button>
        <button type="button" class="ai-chip" data-preset="Improve layout">Improve layout</button>
        <button type="button" class="ai-chip" data-preset="Add loading states">Loading states</button>
      </div>
      <div class="ai-box">
        <textarea id="ai-input" rows="2" placeholder="Describe a change… ⌘↵"></textarea>
        <div class="ai-box-actions">
          <button type="button" class="ai-send" id="ai-send">Send</button>
        </div>
      </div>
    </div>
  `;
  const send = () => {
    const ta = ai.querySelector('#ai-input');
    const t = (ta?.value || '').trim();
    if (t.length < 2) return;
    evolve(t);
  };
  ai.querySelector('#ai-send')?.addEventListener('click', send);
  ai.querySelector('#ai-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); }
  });
  ai.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => {
    evolve(b.getAttribute('data-preset'));
  }));
  return ai;
}

function applyDesign() {
  const iframe = document.querySelector('iframe.preview-frame');
  try {
    const doc = iframe?.contentDocument;
    if (!doc) return;
    let style = doc.getElementById('merveil-design');
    if (!style) {
      style = doc.createElement('style');
      style.id = 'merveil-design';
      doc.head.appendChild(style);
    }
    style.textContent = `:root{--primary:${state.primary};--accent:${state.accent};}`;
  } catch { /* cross-origin */ }
}

/* ══════════ ENGINE ══════════ */
function parseMF(text) {
  const files = [];
  const re = /<MF:BEGIN>\s*path:\s*(\S+)\s*<MF:BYTES>\s*([\s\S]*?)<MF:END>/g;
  let m;
  while ((m = re.exec(text))) {
    files.push({ path: m[1], content: m[2].replace(/^\n/, ''), bytes: m[2].length });
  }
  return files;
}

function materializePreview(files) {
  const htmlFile = files.find((f) => f.path === 'index.html') || files.find((f) => f.path.endsWith('.html'));
  const app = files.find((f) => /App\.(tsx|jsx|js)$/.test(f.path));
  const css = files.find((f) => f.path.endsWith('.css'));
  let body = '';
  if (htmlFile) body = htmlFile.content;
  else {
    body = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${esc(state.projectName)}</title>
      <style>body{font-family:system-ui;padding:24px;background:#faf8f4;color:#0a0a0a}pre{white-space:pre-wrap;font-size:12px;background:#fff;padding:12px;border-radius:8px;border:1px solid #ddd}</style>
      </head><body><h1>${esc(state.projectName)}</h1>
      <p>Generated ${files.length} files. Full WebContainer preview ships in the next engine slice.</p>
      <pre>${esc(files.map((f) => f.path).join('\n'))}</pre>
      ${app ? `<pre>${esc(app.content.slice(0, 2000))}</pre>` : ''}
      ${css ? `<style>${css.content}</style>` : ''}
      </body></html>`;
  }
  if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
  state.previewUrl = URL.createObjectURL(new Blob([body], { type: 'text/html' }));
}

async function ignite() {
  const prompt = state.prompt.trim();
  if (prompt.length < 3) return;
  state.screen = 'build';
  state.buildState = 'planning';
  state.files = [];
  state.messages = [{ role: 'user', text: prompt }];
  state.projectName = prompt.slice(0, 28).replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'untitled-app';
  history.pushState({ screen: 'build' }, '', '/developer?build=1');
  render();

  await new Promise((r) => setTimeout(r, 200));
  state.buildState = 'generating';
  render();

  try {
    const res = await fetch(`${API_BASE || ''}/api/engine/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt, mode: KIND_MAP[state.mode] || 'web_app' }),
    });
    const text = await res.text();
    const files = parseMF(text);
    if (!files.length) throw new Error('No files in stream');
    state.files = files;
    state.buildState = 'building';
    state.events.push({ type: 'pipeline:completed', n: files.length });
    state.messages.push({
      role: 'bot',
      text: `Built ${files.length} files.`,
      files: files.map((f) => f.path),
    });
    render();
    materializePreview(files);
    state.buildState = 'ready';
    render();
  } catch (err) {
    state.buildState = 'failed';
    state.messages.push({ role: 'bot', text: `Build failed: ${err.message || err}` });
    render();
  }
}

async function evolve(instruction) {
  state.messages.push({ role: 'user', text: instruction });
  state.buildState = 'generating';
  render();
  try {
    const res = await fetch(`${API_BASE || ''}/api/engine/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        prompt: `EVOLVE existing app.\nInstruction: ${instruction}\nCurrent files:\n${state.files.map((f) => f.path).join('\n')}\n\nEmit only changed files in MF protocol.`,
        mode: KIND_MAP[state.mode] || 'web_app',
      }),
    });
    const text = await res.text();
    const files = parseMF(text);
    if (files.length) {
      const map = new Map(state.files.map((f) => [f.path, f]));
      for (const f of files) map.set(f.path, f);
      state.files = [...map.values()];
      materializePreview(state.files);
      state.messages.push({ role: 'bot', text: `Updated ${files.length} file(s).`, files: files.map((f) => f.path) });
    } else {
      state.messages.push({ role: 'bot', text: text.slice(0, 500) || 'No file changes returned.' });
    }
    state.buildState = 'ready';
  } catch (err) {
    state.messages.push({ role: 'bot', text: String(err.message || err) });
    state.buildState = 'failed';
  }
  render();
}

function startVoice(ta) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return;
  const r = new SR();
  r.lang = 'en-US';
  r.onresult = (e) => {
    const t = e.results?.[0]?.[0]?.transcript || '';
    if (ta) {
      ta.value = (ta.value + ' ' + t).trim();
      state.prompt = ta.value;
      ta.dispatchEvent(new Event('input'));
    }
  };
  r.start();
}

function bindGlobal() {
  window.onkeydown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      if (state.screen === 'home') ignite();
    }
  };
}

window.addEventListener('popstate', () => {
  state.screen = location.search.includes('build') ? 'build' : 'home';
  render();
});

loadPassport().then(() => {
  if (location.search.includes('build=1')) state.screen = 'build';
  render();
});
