/**
 * Merveil Developer V5 — Beginner + Pro
 * Real tools: local projects, seeds, ZIP export, GitHub push, Vercel deploy.
 * Tokens stay in the browser (localStorage). Ship API proxies with user token per request.
 */
import { API_BASE } from './config.js';
import { SEED_PROJECTS, blankProject } from './seeds.js';

const LS_KEY = 'merveil_dev_projects_v5';
const LS_ACTIVE = 'merveil_dev_active_v5';
const LS_MODE = 'merveil_dev_mode_v5';
const LS_TOKENS = 'merveil_dev_tokens_v5';
const LS_SEEDED = 'merveil_dev_seeded_v5';

const state = {
  mode: /** @type {'beginner'|'pro'} */ (localStorage.getItem(LS_MODE) === 'pro' ? 'pro' : 'beginner'),
  view: /** @type {'dash'|'workspace'} */ ('dash'),
  projects: [],
  activeId: null,
  openTabs: [],
  activePath: null,
  dirty: new Set(),
  rail: 'files',
  termLines: ['Merveil Developer ready.', 'Beginner + Pro share the same projects.'],
  health: { storage: 'ok', api: 'warn', ship: 'warn', engine: 'warn' },
  modal: null, // 'new' | 'ship' | 'settings' | 'github' | 'vercel'
  modalName: '',
  filter: '',
  tokens: { github: '', vercel: '', githubLogin: '', vercelUser: '' },
  shipping: false,
  toast: null,
};

const app = document.getElementById('app');

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

function loadTokens() {
  try {
    const t = JSON.parse(localStorage.getItem(LS_TOKENS) || '{}');
    state.tokens = { github: '', vercel: '', githubLogin: '', vercelUser: '', ...t };
  } catch { /* */ }
}

function saveTokens() {
  localStorage.setItem(LS_TOKENS, JSON.stringify({
    github: state.tokens.github || '',
    vercel: state.tokens.vercel || '',
    githubLogin: state.tokens.githubLogin || '',
    vercelUser: state.tokens.vercelUser || '',
  }));
}

function load() {
  loadTokens();
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) state.projects = JSON.parse(raw);
  } catch { state.projects = []; }

  // First visit: materialize all 10 seeds into "Your projects"
  if (!localStorage.getItem(LS_SEEDED) && state.projects.length === 0) {
    const now = Date.now();
    SEED_PROJECTS.forEach((s, i) => {
      state.projects.push({
        id: 'seed-' + s.id,
        name: s.name,
        tag: s.tag,
        desc: s.desc,
        color: s.color,
        files: { ...s.files },
        createdAt: now - (SEED_PROJECTS.length - i) * 1000,
        updatedAt: now - (SEED_PROJECTS.length - i) * 1000,
        fromSeed: s.id,
      });
    });
    localStorage.setItem(LS_SEEDED, '1');
    save();
    log('Loaded 10 starter projects into your workspace', 'ok');
  }

  state.activeId = localStorage.getItem(LS_ACTIVE);
  if (state.activeId && !state.projects.find((p) => p.id === state.activeId)) state.activeId = null;
}

function save() {
  localStorage.setItem(LS_KEY, JSON.stringify(state.projects));
  if (state.activeId) localStorage.setItem(LS_ACTIVE, state.activeId);
  else localStorage.removeItem(LS_ACTIVE);
  localStorage.setItem(LS_MODE, state.mode);
}

function activeProject() {
  return state.projects.find((p) => p.id === state.activeId) || null;
}

function log(msg, cls = '') {
  const t = new Date().toLocaleTimeString();
  state.termLines.push((cls ? `[${cls}] ` : '') + `${t}  ${msg}`);
  if (state.termLines.length > 200) state.termLines = state.termLines.slice(-150);
}

function toast(msg, href) {
  state.toast = { msg, href, at: Date.now() };
  setTimeout(() => {
    if (state.toast && Date.now() - state.toast.at >= 5000) {
      state.toast = null;
      render();
    }
  }, 5200);
}

function iconFor(path) {
  if (/\.tsx?$/.test(path)) return 'TS';
  if (/\.jsx?$/.test(path)) return 'JS';
  if (/\.css$/.test(path)) return 'CSS';
  if (/\.json$/.test(path)) return '{}';
  if (/\.html?$/.test(path)) return '<>';
  if (/\.md$/.test(path)) return 'MD';
  return '·';
}

function pathsOf(proj) {
  return Object.keys(proj.files || {}).sort((a, b) => a.localeCompare(b));
}

function openProject(id) {
  const p = state.projects.find((x) => x.id === id);
  if (!p) return;
  state.activeId = id;
  state.view = 'workspace';
  state.openTabs = [];
  state.activePath = null;
  state.dirty = new Set();
  const prefer = ['src/App.tsx', 'src/App.jsx', 'index.html', 'README.md'];
  const first = prefer.find((f) => p.files[f]) || pathsOf(p)[0];
  if (first) {
    state.openTabs = [first];
    state.activePath = first;
  }
  save();
  log(`Opened ${p.name}`);
  render();
}

function createFromSeed(seed) {
  const id = seed.id + '-' + Date.now().toString(36);
  const proj = {
    id,
    name: seed.name,
    tag: seed.tag,
    desc: seed.desc,
    color: seed.color,
    files: { ...seed.files },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    fromSeed: seed.id,
  };
  state.projects.unshift(proj);
  save();
  log(`Cloned template: ${seed.name}`, 'ok');
  openProject(id);
}

function createBlank() {
  const name = (state.modalName || 'untitled-app').trim() || 'untitled-app';
  const seed = blankProject(name);
  const proj = {
    id: seed.id,
    name: seed.name,
    tag: 'Blank',
    desc: seed.desc,
    color: seed.color,
    files: seed.files,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  state.projects.unshift(proj);
  state.modal = null;
  state.modalName = '';
  save();
  log(`Created blank: ${proj.name}`, 'ok');
  openProject(proj.id);
}

function deleteProject(id) {
  if (!confirm('Delete this project from this browser?')) return;
  state.projects = state.projects.filter((p) => p.id !== id);
  if (state.activeId === id) {
    state.activeId = null;
    state.view = 'dash';
  }
  save();
  log('Project deleted');
  render();
}

function setFileContent(path, content) {
  const p = activeProject();
  if (!p) return;
  p.files[path] = content;
  p.updatedAt = Date.now();
  state.dirty.add(path);
  save();
}

function addFile() {
  const p = activeProject();
  if (!p) return;
  const path = prompt('File path (e.g. src/util.ts)', 'src/new-file.ts');
  if (!path || !path.trim()) return;
  const clean = path.trim().replace(/^\/+/, '');
  if (p.files[clean] != null) { alert('File already exists'); return; }
  p.files[clean] = '';
  p.updatedAt = Date.now();
  state.openTabs.push(clean);
  state.activePath = clean;
  state.dirty.add(clean);
  save();
  log(`Added ${clean}`);
  render();
}

function closeTab(path) {
  state.openTabs = state.openTabs.filter((t) => t !== path);
  if (state.activePath === path) state.activePath = state.openTabs[state.openTabs.length - 1] || null;
  render();
}

function exportZip() {
  const p = activeProject();
  if (!p) return;
  const files = Object.entries(p.files);
  const parts = [];
  const central = [];
  let offset = 0;
  const enc = new TextEncoder();

  function crc32(buf) {
    let c = ~0;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
    return ~c >>> 0;
  }

  for (const [name, text] of files) {
    const data = enc.encode(text);
    const nameBytes = enc.encode(name);
    const crc = crc32(data);
    const local = new Uint8Array(30 + nameBytes.length + data.length);
    const view = new DataView(local.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, data.length, true);
    view.setUint32(22, data.length, true);
    view.setUint16(26, nameBytes.length, true);
    local.set(nameBytes, 30);
    local.set(data, 30 + nameBytes.length);
    parts.push(local);

    const cen = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(cen.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint32(42, offset, true);
    cen.set(nameBytes, 46);
    central.push(cen);
    offset += local.length;
  }

  const centralSize = central.reduce((s, x) => s + x.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);

  const blob = new Blob([...parts, ...central, end], { type: 'application/zip' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${p.name.replace(/\s+/g, '-').toLowerCase()}.zip`;
  a.click();
  URL.revokeObjectURL(a.href);
  log(`Exported ${p.name}.zip (${files.length} files)`, 'ok');
  toast(`Downloaded ${p.name}.zip — run npm i && npm run dev`);
  render();
}

async function shipApi(body) {
  const res = await fetch(`${API_BASE}/api/dev/ship`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || data.error || `HTTP ${res.status}`);
    err.data = data;
    err.status = res.status;
    throw err;
  }
  return data;
}

async function pushGithub() {
  const p = activeProject();
  if (!p) return;
  if (!state.tokens.github) {
    state.modal = 'settings';
    toast('Add a GitHub token in Settings first');
    render();
    return;
  }
  state.shipping = true;
  render();
  const repoName = p.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'merveil-app';
  log(`GitHub: creating ${repoName}…`, 'cmd');
  try {
    const data = await shipApi({
      action: 'github_create_and_push',
      token: state.tokens.github,
      name: repoName,
      description: p.desc || `Built with Merveil Developer — ${p.tag || 'app'}`,
      private: true,
      files: p.files,
    });
    log(`GitHub OK → ${data.html_url} (${data.files} files)`, 'ok');
    toast(`Pushed to GitHub`, data.html_url);
    p.githubUrl = data.html_url;
    p.updatedAt = Date.now();
    save();
  } catch (e) {
    log(`GitHub failed: ${e.message}`, 'err');
    toast(String(e.message));
  }
  state.shipping = false;
  state.modal = null;
  render();
}

async function deployVercel() {
  const p = activeProject();
  if (!p) return;
  if (!state.tokens.vercel) {
    state.modal = 'settings';
    toast('Add a Vercel token in Settings first');
    render();
    return;
  }
  state.shipping = true;
  render();
  const name = p.name.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'merveil-app';
  log(`Vercel: deploying ${name}…`, 'cmd');
  try {
    const data = await shipApi({
      action: 'vercel_deploy',
      token: state.tokens.vercel,
      name,
      files: p.files,
      target: 'production',
    });
    log(`Vercel OK → ${data.url || data.id}`, 'ok');
    toast(`Deploy started`, data.url);
    p.vercelUrl = data.url;
    p.updatedAt = Date.now();
    save();
  } catch (e) {
    log(`Vercel failed: ${e.message}`, 'err');
    toast(String(e.message));
  }
  state.shipping = false;
  state.modal = null;
  render();
}

async function verifyTokens() {
  if (state.tokens.github) {
    try {
      const d = await shipApi({ action: 'github_whoami', token: state.tokens.github });
      state.tokens.githubLogin = d.login || '';
      log(`GitHub linked: @${d.login}`, 'ok');
    } catch (e) {
      state.tokens.githubLogin = '';
      log(`GitHub token invalid: ${e.message}`, 'err');
    }
  }
  if (state.tokens.vercel) {
    try {
      const d = await shipApi({ action: 'vercel_whoami', token: state.tokens.vercel });
      state.tokens.vercelUser = d.user || d.email || '';
      log(`Vercel linked: ${state.tokens.vercelUser}`, 'ok');
    } catch (e) {
      state.tokens.vercelUser = '';
      log(`Vercel token invalid: ${e.message}`, 'err');
    }
  }
  saveTokens();
  render();
}

async function checkHealth() {
  try {
    localStorage.setItem('merveil_dev_health', '1');
    localStorage.removeItem('merveil_dev_health');
    state.health.storage = 'ok';
  } catch { state.health.storage = 'fail'; }

  try {
    const r = await fetch(`${API_BASE}/api/dev/ship`, { method: 'OPTIONS' });
    state.health.ship = (r.ok || r.status === 204 || r.status === 405) ? 'ok' : 'warn';
  } catch { state.health.ship = 'warn'; }

  try {
    const r = await fetch(`${API_BASE}/api/engine/generate`, { method: 'OPTIONS' });
    state.health.engine = (r.ok || r.status === 204 || r.status === 405) ? 'ok' : 'warn';
  } catch { state.health.engine = 'warn'; }

  try {
    const r = await fetch(`${API_BASE}/api/auth/session`, { credentials: 'include' });
    state.health.api = (r.ok || r.status === 401 || r.status === 403) ? 'ok' : 'warn';
  } catch { state.health.api = 'warn'; }

  render();
}

function healthClass(v) {
  return v === 'ok' ? 'ok' : v === 'fail' ? 'fail' : 'warn';
}

/* ——— Render ——— */

function render() {
  if (!app) return;
  app.innerHTML = '';
  app.appendChild(renderTop());
  if (state.view === 'dash') app.appendChild(renderDash());
  else app.appendChild(renderWorkspace());
  app.appendChild(renderStatus());
  if (state.modal) app.appendChild(renderModal());
  if (state.toast) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = state.toast.href
      ? `${esc(state.toast.msg)} · <a href="${esc(state.toast.href)}" target="_blank" rel="noopener">Open</a>`
      : esc(state.toast.msg);
    app.appendChild(t);
  }
}

function renderTop() {
  const el = document.createElement('header');
  el.className = 'top';
  const p = activeProject();
  el.innerHTML = `
    <div class="brand"><span class="orb"></span> Merveil Developer</div>
    <div class="mode-switch">
      <button type="button" class="${state.mode === 'beginner' ? 'on beginner' : ''}" data-mode="beginner">Beginner</button>
      <button type="button" class="${state.mode === 'pro' ? 'on pro' : ''}" data-mode="pro">Pro</button>
    </div>
    <div class="sep"></div>
    <span class="proj-name">${state.view === 'workspace' && p ? esc(p.name) : 'Projects'}</span>
    <div class="spacer"></div>
    <span class="pill"><span class="live"></span> ${state.mode}</span>
    <button type="button" class="btn sm ghost" data-act="settings">Settings</button>
    ${state.view === 'workspace' ? `
      <button type="button" class="btn sm ghost" data-act="dash">All projects</button>
      <button type="button" class="btn sm ship" data-act="ship" ${state.shipping ? 'disabled' : ''}>Ship</button>
    ` : ''}
    <button type="button" class="btn sm primary" data-act="new">New</button>
  `;
  el.querySelectorAll('[data-mode]').forEach((b) => {
    b.addEventListener('click', () => {
      state.mode = b.getAttribute('data-mode');
      save();
      render();
    });
  });
  el.querySelector('[data-act="new"]')?.addEventListener('click', () => {
    state.modal = 'new';
    state.modalName = '';
    render();
  });
  el.querySelector('[data-act="dash"]')?.addEventListener('click', () => { state.view = 'dash'; render(); });
  el.querySelector('[data-act="ship"]')?.addEventListener('click', () => { state.modal = 'ship'; render(); });
  el.querySelector('[data-act="settings"]')?.addEventListener('click', () => { state.modal = 'settings'; render(); });
  return el;
}

function renderDash() {
  const shell = document.createElement('div');
  shell.className = 'shell';
  const main = document.createElement('div');
  main.className = 'main';
  const dash = document.createElement('div');
  dash.className = 'dash';

  const q = state.filter.trim().toLowerCase();
  const mine = q
    ? state.projects.filter((p) => (p.name + p.tag + (p.desc || '')).toLowerCase().includes(q))
    : state.projects;

  const isBeginner = state.mode === 'beginner';

  dash.innerHTML = `
    <div class="hero">
      <h1>${isBeginner ? 'Idea → project → ship' : 'Pro workspace'}</h1>
      <p>${isBeginner
        ? 'Pick a starter (already in your list), edit files, then Ship: ZIP, GitHub, or Vercel. No AI required.'
        : 'Dense editor, shared project store with Beginner mode. Export, GitHub push, and Vercel deploy use your tokens.'}</p>
      <div class="hero-actions">
        <button type="button" class="btn primary" data-act="new">New blank project</button>
        <button type="button" class="btn" data-act="settings">Connect GitHub / Vercel</button>
        ${state.tokens.githubLogin ? `<span class="pill">GH @${esc(state.tokens.githubLogin)}</span>` : ''}
        ${state.tokens.vercelUser ? `<span class="pill">Vercel ${esc(state.tokens.vercelUser)}</span>` : ''}
      </div>
    </div>
    ${isBeginner ? `
    <div class="steps">
      <div class="step"><div class="n">1</div><h3>Open a starter</h3><p>10 real Vite + React apps are already in Your projects.</p></div>
      <div class="step"><div class="n">2</div><h3>Edit</h3><p>Change text, colors, data. Files save in this browser.</p></div>
      <div class="step"><div class="n">3</div><h3>Ship</h3><p>Download ZIP, push to GitHub, or deploy on Vercel.</p></div>
      <div class="step"><div class="n">4</div><h3>Run locally</h3><p>After ZIP: <code>npm i && npm run dev</code></p></div>
    </div>` : ''}
    <div class="health">
      <div class="item ${healthClass(state.health.storage)}"><span class="s"></span> Storage</div>
      <div class="item ${healthClass(state.health.ship)}"><span class="s"></span> Ship API</div>
      <div class="item ${healthClass(state.health.api)}"><span class="s"></span> Session API</div>
      <div class="item ${healthClass(state.health.engine)}"><span class="s"></span> AI engine (optional)</div>
      <button type="button" class="btn sm" data-act="recheck">Recheck</button>
      <input id="filter" placeholder="Filter projects…" value="${esc(state.filter)}"
        style="margin-left:auto;padding:6px 12px;border-radius:8px;border:1px solid var(--line);background:var(--bg-1);min-width:160px" />
    </div>
    <div class="section-t">Your projects <span class="count">${mine.length}</span></div>
    <div class="cards" id="mine"></div>
    <div class="section-t">Clone another template <span class="count">10</span></div>
    <div class="cards" id="seeds"></div>
  `;

  const mineEl = dash.querySelector('#mine');
  if (!mine.length) {
    mineEl.innerHTML = `<div class="empty-box"><h3>No projects</h3><p>Clone a template below.</p></div>`;
  } else {
    mine.forEach((p) => {
      const c = document.createElement('button');
      c.type = 'button';
      c.className = 'card';
      c.style.setProperty('--card-accent', p.color || '#39c5cf');
      const files = Object.keys(p.files || {}).length;
      c.innerHTML = `
        <div class="swatch" style="background:${esc(p.color || '#39c5cf')}">${esc((p.name || '?')[0])}</div>
        <h3>${esc(p.name)}</h3>
        <span class="tag">${esc(p.tag || 'Project')} · ${files} files</span>
        <p>${esc(p.desc || '')}</p>
        <div class="meta"><span>${new Date(p.updatedAt).toLocaleDateString()}</span>
          <span>${p.githubUrl ? 'GitHub' : ''}${p.vercelUrl ? ' · Live' : ''}</span></div>
      `;
      c.addEventListener('click', () => openProject(p.id));
      c.addEventListener('contextmenu', (e) => { e.preventDefault(); deleteProject(p.id); });
      mineEl.appendChild(c);
    });
  }

  const seedsEl = dash.querySelector('#seeds');
  SEED_PROJECTS.forEach((s) => {
    const c = document.createElement('button');
    c.type = 'button';
    c.className = 'card';
    c.style.setProperty('--card-accent', s.color);
    c.innerHTML = `
      <span class="badge-new">TEMPLATE</span>
      <div class="swatch" style="background:${esc(s.color)}">${esc(s.name[0])}</div>
      <h3>${esc(s.name)}</h3>
      <span class="tag">${esc(s.tag)} · ${Object.keys(s.files).length} files</span>
      <p>${esc(s.desc)}</p>
      <div class="meta"><span>Clone into workspace</span></div>
    `;
    c.addEventListener('click', () => createFromSeed(s));
    seedsEl.appendChild(c);
  });

  dash.querySelector('#filter')?.addEventListener('input', (e) => {
    state.filter = e.target.value;
    render();
  });
  dash.querySelector('[data-act="recheck"]')?.addEventListener('click', () => checkHealth());
  dash.querySelector('[data-act="new"]')?.addEventListener('click', () => {
    state.modal = 'new'; state.modalName = ''; render();
  });
  dash.querySelector('[data-act="settings"]')?.addEventListener('click', () => {
    state.modal = 'settings'; render();
  });

  main.appendChild(dash);
  shell.appendChild(main);
  return shell;
}

function renderWorkspace() {
  const p = activeProject();
  const shell = document.createElement('div');
  shell.className = 'shell';

  const rail = document.createElement('nav');
  rail.className = 'rail';
  ;[
    ['files', '☰'],
    ['ship', '▲'],
  ].forEach(([id, ico]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = state.rail === id ? 'on' : '';
    b.title = id;
    b.textContent = ico;
    b.addEventListener('click', () => {
      if (id === 'ship') { state.modal = 'ship'; render(); return; }
      state.rail = id;
      render();
    });
    rail.appendChild(b);
  });

  const panel = document.createElement('aside');
  panel.className = 'panel';
  panel.innerHTML = `<div class="panel-h"><span>Files</span><button type="button" class="btn sm" data-act="addfile">+</button></div>`;
  const body = document.createElement('div');
  body.className = 'panel-body';
  if (p) {
    pathsOf(p).forEach((path) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tree-item' + (state.activePath === path ? ' on' : '');
      b.innerHTML = `<span class="ico">${iconFor(path)}</span><span class="nm">${esc(path)}${state.dirty.has(path) ? ' •' : ''}</span>`;
      b.addEventListener('click', () => {
        if (!state.openTabs.includes(path)) state.openTabs.push(path);
        state.activePath = path;
        render();
      });
      body.appendChild(b);
    });
  }
  panel.appendChild(body);
  panel.querySelector('[data-act="addfile"]')?.addEventListener('click', addFile);

  const main = document.createElement('div');
  main.className = 'main';

  const tabs = document.createElement('div');
  tabs.className = 'tabs';
  state.openTabs.forEach((path) => {
    const t = document.createElement('button');
    t.type = 'button';
    t.className = 'tab' + (state.activePath === path ? ' on' : '');
    t.innerHTML = `<span>${esc(path.split('/').pop())}${state.dirty.has(path) ? ' •' : ''}</span><span class="x" data-x>×</span>`;
    t.addEventListener('click', (e) => {
      if (e.target.dataset.x != null) { closeTab(path); return; }
      state.activePath = path;
      render();
    });
    tabs.appendChild(t);
  });
  main.appendChild(tabs);

  const wrap = document.createElement('div');
  wrap.className = 'editor-wrap';
  const ta = document.createElement('textarea');
  ta.className = 'editor';
  ta.spellcheck = false;
  ta.value = p && state.activePath ? (p.files[state.activePath] ?? '') : '';
  ta.placeholder = 'Select a file';
  ta.addEventListener('input', () => {
    if (!state.activePath) return;
    setFileContent(state.activePath, ta.value);
  });
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      ta.value = ta.value.slice(0, start) + '  ' + ta.value.slice(end);
      ta.selectionStart = ta.selectionEnd = start + 2;
      ta.dispatchEvent(new Event('input'));
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      state.dirty.delete(state.activePath);
      log('Saved ' + state.activePath, 'ok');
      render();
    }
  });
  wrap.appendChild(ta);

  if (state.mode === 'beginner') {
    const guide = document.createElement('aside');
    guide.className = 'guide';
    guide.innerHTML = `
      <h4>Beginner guide</h4>
      <ol>
        <li>Edit <code>src/App.tsx</code> for UI text and layout.</li>
        <li>Edit <code>src/styles.css</code> for colors.</li>
        <li>Click <strong>Ship</strong> when ready.</li>
        <li>ZIP → run locally with npm.</li>
        <li>GitHub needs a classic PAT with <code>repo</code> scope.</li>
        <li>Vercel needs a token from vercel.com/account/tokens.</li>
      </ol>
      <div class="tip">Pro mode uses the same projects — switch anytime from the top bar.</div>
    `;
    wrap.appendChild(guide);
  }
  main.appendChild(wrap);

  const term = document.createElement('div');
  term.className = 'term';
  term.innerHTML = `<div class="term-h">Terminal</div><div class="term-out"></div>`;
  const out = term.querySelector('.term-out');
  state.termLines.forEach((line) => {
    const div = document.createElement('div');
    if (line.startsWith('[ok]')) div.className = 'ok';
    else if (line.startsWith('[err]')) div.className = 'err';
    else if (line.startsWith('[cmd]')) div.className = 'cmd';
    div.textContent = line.replace(/^\[(ok|err|cmd)\]\s*/, '');
    out.appendChild(div);
  });
  out.scrollTop = out.scrollHeight;
  main.appendChild(term);

  shell.appendChild(rail);
  shell.appendChild(panel);
  shell.appendChild(main);
  return shell;
}

function renderStatus() {
  const p = activeProject();
  const el = document.createElement('div');
  el.className = 'status';
  el.innerHTML = `
    <span>${state.mode} · ${state.view}</span>
    <span>${p ? pathsOf(p).length + ' files' : state.projects.length + ' projects'}</span>
    <span class="r">Ctrl/Cmd+S save · Ship = ZIP / GitHub / Vercel</span>
  `;
  return el;
}

function renderModal() {
  const bg = document.createElement('div');
  bg.className = 'modal-bg';

  if (state.modal === 'new') {
    bg.innerHTML = `
      <div class="modal">
        <h2>New blank project</h2>
        <p class="sub">Vite + React + TypeScript starter. No AI required.</p>
        <label>Project name</label>
        <input id="nm" placeholder="my-app" value="${esc(state.modalName)}" />
        <div class="modal-actions">
          <button type="button" class="btn ghost" data-act="cancel">Cancel</button>
          <button type="button" class="btn primary" data-act="go">Create</button>
        </div>
      </div>`;
    bg.querySelector('[data-act="go"]')?.addEventListener('click', () => {
      state.modalName = bg.querySelector('#nm').value;
      createBlank();
    });
    bg.querySelector('#nm')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { state.modalName = e.target.value; createBlank(); }
    });
  } else if (state.modal === 'ship') {
    const p = activeProject();
    bg.innerHTML = `
      <div class="modal">
        <h2>Ship ${esc(p?.name || '')}</h2>
        <p class="sub">Real paths only. Tokens stay in your browser and are sent only for the request.</p>
        <div class="ship-grid">
          <button type="button" class="ship-opt" data-act="zip">
            <span class="ic" style="background:#39c5cf">ZIP</span>
            <div><h3>Download ZIP</h3><p>Works offline. Then npm i && npm run dev on your machine.</p></div>
          </button>
          <button type="button" class="ship-opt" data-act="gh" ${state.shipping ? 'disabled' : ''}>
            <span class="ic" style="background:#a371f7">GH</span>
            <div><h3>Push to GitHub</h3><p>${state.tokens.githubLogin ? 'Signed in as @' + esc(state.tokens.githubLogin) : 'Needs classic PAT with repo scope in Settings.'}</p></div>
          </button>
          <button type="button" class="ship-opt" data-act="vc" ${state.shipping ? 'disabled' : ''}>
            <span class="ic" style="background:#f78166">▲</span>
            <div><h3>Deploy on Vercel</h3><p>${state.tokens.vercelUser ? 'Account: ' + esc(state.tokens.vercelUser) : 'Needs Vercel token in Settings.'}</p></div>
          </button>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn ghost" data-act="settings">Settings</button>
          <button type="button" class="btn ghost" data-act="cancel">Close</button>
        </div>
      </div>`;
    bg.querySelector('[data-act="zip"]')?.addEventListener('click', () => { state.modal = null; exportZip(); });
    bg.querySelector('[data-act="gh"]')?.addEventListener('click', () => pushGithub());
    bg.querySelector('[data-act="vc"]')?.addEventListener('click', () => deployVercel());
    bg.querySelector('[data-act="settings"]')?.addEventListener('click', () => { state.modal = 'settings'; render(); });
  } else if (state.modal === 'settings') {
    bg.innerHTML = `
      <div class="modal">
        <h2>Ship credentials</h2>
        <p class="sub">Stored only in this browser (localStorage). Used when you click Ship → GitHub or Vercel.</p>
        <label>GitHub personal access token (classic, scope: repo)</label>
        <input id="gh" type="password" placeholder="ghp_…" value="${esc(state.tokens.github)}" autocomplete="off" />
        <label>Vercel token</label>
        <input id="vc" type="password" placeholder="vercel_…" value="${esc(state.tokens.vercel)}" autocomplete="off" />
        <p class="sub" style="margin-top:10px">Create tokens at github.com/settings/tokens and vercel.com/account/tokens. Never share them.</p>
        <div class="modal-actions">
          <button type="button" class="btn ghost" data-act="cancel">Cancel</button>
          <button type="button" class="btn" data-act="verify">Save & verify</button>
        </div>
      </div>`;
    bg.querySelector('[data-act="verify"]')?.addEventListener('click', async () => {
      state.tokens.github = bg.querySelector('#gh').value.trim();
      state.tokens.vercel = bg.querySelector('#vc').value.trim();
      saveTokens();
      state.modal = null;
      render();
      await verifyTokens();
    });
  }

  bg.querySelector('[data-act="cancel"]')?.addEventListener('click', () => { state.modal = null; render(); });
  bg.addEventListener('click', (e) => { if (e.target === bg) { state.modal = null; render(); } });
  return bg;
}

// Boot
load();
render();
checkHealth();
log(`${state.projects.length} projects · ${SEED_PROJECTS.length} templates · mode=${state.mode}`);
