/**
 * Merveil Pro Studio — light UI, IDE + templates + ship + debug + profile
 * Separate from Beginner (/developer). Shared project store: merveil_dev_projects_v5
 */
import { API_BASE } from './config.js';
import { SEED_PROJECTS, blankProject } from './seeds.js';

const LS_KEY = 'merveil_dev_projects_v5';
const LS_ACTIVE = 'merveil_dev_active_v5';
const LS_TOKENS = 'merveil_dev_tokens_v5';

const state = {
  view: 'dash',
  projects: [],
  activeId: null,
  openTabs: [],
  activePath: null,
  dirty: new Set(),
  termLines: ['Pro Studio ready.', 'Templates, editor, Ship, Debug, Profile.'],
  modal: null,
  modalName: '',
  tokens: { github: '', vercel: '', githubLogin: '', vercelUser: '' },
  shipping: false,
  debugOpen: false,
  filter: '',
};

const app = document.getElementById('app');

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

function load() {
  try {
    const t = JSON.parse(localStorage.getItem(LS_TOKENS) || '{}');
    state.tokens = { github: '', vercel: '', githubLogin: '', vercelUser: '', ...t };
  } catch {}
  try {
    state.projects = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  } catch { state.projects = []; }
  state.activeId = localStorage.getItem(LS_ACTIVE);
  if (state.activeId && !state.projects.find((p) => p.id === state.activeId)) state.activeId = null;
}

function save() {
  localStorage.setItem(LS_KEY, JSON.stringify(state.projects));
  if (state.activeId) localStorage.setItem(LS_ACTIVE, state.activeId);
  else localStorage.removeItem(LS_ACTIVE);
  localStorage.setItem(LS_TOKENS, JSON.stringify({
    github: state.tokens.github || '',
    vercel: state.tokens.vercel || '',
    githubLogin: state.tokens.githubLogin || '',
    vercelUser: state.tokens.vercelUser || '',
  }));
}

function activeProject() {
  return state.projects.find((p) => p.id === state.activeId) || null;
}

function log(msg, cls = '') {
  const t = new Date().toLocaleTimeString();
  state.termLines.push((cls ? `[${cls}] ` : '') + `${t}  ${msg}`);
  if (state.termLines.length > 200) state.termLines = state.termLines.slice(-150);
}

function pathsOf(p) {
  return Object.keys(p.files || {}).sort((a, b) => a.localeCompare(b));
}

function openProject(id) {
  const p = state.projects.find((x) => x.id === id);
  if (!p) return;
  state.activeId = id;
  state.view = 'workspace';
  state.openTabs = [];
  state.activePath = null;
  state.dirty = new Set();
  state.debugOpen = false;
  const prefer = ['src/App.tsx', 'src/App.jsx', 'index.html', 'README.md'];
  const first = prefer.find((f) => p.files[f]) || pathsOf(p)[0];
  if (first) { state.openTabs = [first]; state.activePath = first; }
  save();
  log('Opened ' + p.name);
  render();
}

function createFromSeed(seed) {
  const id = seed.id + '-' + Date.now().toString(36);
  state.projects.unshift({
    id, name: seed.name, tag: seed.tag, desc: seed.desc, color: seed.color,
    files: { ...seed.files }, createdAt: Date.now(), updatedAt: Date.now(), fromSeed: seed.id,
  });
  save();
  log('Template: ' + seed.name, 'ok');
  openProject(id);
}

function createBlank() {
  const name = (state.modalName || 'untitled-app').trim() || 'untitled-app';
  const seed = blankProject(name);
  state.projects.unshift({
    id: seed.id, name: seed.name, tag: 'Blank', desc: seed.desc, color: seed.color,
    files: seed.files, createdAt: Date.now(), updatedAt: Date.now(),
  });
  state.modal = null;
  save();
  openProject(seed.id);
}

function deleteProject(id) {
  if (!confirm('Delete this project?')) return;
  state.projects = state.projects.filter((p) => p.id !== id);
  if (state.activeId === id) { state.activeId = null; state.view = 'dash'; }
  save();
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
  const path = prompt('File path', 'src/new-file.ts');
  if (!path?.trim()) return;
  const clean = path.trim().replace(/^\/+/, '');
  if (p.files[clean] != null) { alert('Exists'); return; }
  p.files[clean] = '';
  state.openTabs.push(clean);
  state.activePath = clean;
  state.dirty.add(clean);
  save();
  render();
}

function exportZip() {
  const p = activeProject();
  if (!p) return;
  const files = Object.entries(p.files);
  const parts = [], central = [];
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
  a.download = p.name.replace(/\s+/g, '-').toLowerCase() + '.zip';
  a.click();
  URL.revokeObjectURL(a.href);
  log('Exported ZIP', 'ok');
  render();
}

async function shipApi(body) {
  const res = await fetch(`${API_BASE}/api/dev/ship`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || 'HTTP ' + res.status);
  return data;
}

async function pushGithub() {
  const p = activeProject();
  if (!p) return;
  if (!state.tokens.github) { state.modal = 'profile'; render(); return; }
  state.shipping = true; render();
  const repoName = p.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'merveil-app';
  log('GitHub: ' + repoName, 'cmd');
  try {
    const data = await shipApi({
      action: 'github_create_and_push', token: state.tokens.github,
      name: repoName, description: p.desc || p.name, private: true, files: p.files,
    });
    log('GitHub OK ' + data.html_url, 'ok');
    p.githubUrl = data.html_url; save();
  } catch (e) { log('GitHub: ' + e.message, 'err'); }
  state.shipping = false; state.modal = null; render();
}

async function deployVercel() {
  const p = activeProject();
  if (!p) return;
  if (!state.tokens.vercel) { state.modal = 'profile'; render(); return; }
  state.shipping = true; render();
  const name = p.name.toLowerCase().replace(/[^a-z0-9-]+/g, '-').slice(0, 40) || 'merveil-app';
  log('Vercel: ' + name, 'cmd');
  try {
    const data = await shipApi({
      action: 'vercel_deploy', token: state.tokens.vercel, name, files: p.files, target: 'production',
    });
    log('Vercel OK ' + (data.url || data.id), 'ok');
    p.vercelUrl = data.url; save();
  } catch (e) { log('Vercel: ' + e.message, 'err'); }
  state.shipping = false; state.modal = null; render();
}

function runDebug() {
  const p = activeProject();
  const report = {
    project: p?.name || null,
    files: p ? pathsOf(p).length : 0,
    activePath: state.activePath,
    dirty: [...state.dirty],
    hasPackage: !!(p?.files?.['package.json']),
    hasIndex: !!(p?.files?.['index.html']),
    hasApp: !!(p?.files?.['src/App.tsx'] || p?.files?.['src/App.jsx']),
    github: !!state.tokens.github,
    vercel: !!state.tokens.vercel,
    storage: (() => { try { localStorage.setItem('_d','1'); localStorage.removeItem('_d'); return 'ok'; } catch { return 'fail'; } })(),
  };
  state.debugOpen = true;
  log('Debug report generated', 'ok');
  state._debug = report;
  render();
}

function render() {
  if (!app) return;
  app.innerHTML = '';
  app.appendChild(renderTop());
  if (state.view === 'dash') app.appendChild(renderDash());
  else app.appendChild(renderWorkspace());
  const st = document.createElement('div');
  st.className = 'status';
  const p = activeProject();
  st.innerHTML = `<span>Pro Studio</span><span>${p ? pathsOf(p).length + ' files' : state.projects.length + ' projects'}</span><span class="r"><a href="/developer" style="color:inherit">← Beginner</a> · Ctrl+S save</span>`;
  app.appendChild(st);
  if (state.modal) app.appendChild(renderModal());
}

function renderTop() {
  const el = document.createElement('header');
  el.className = 'top';
  const p = activeProject();
  el.innerHTML = `
    <div class="brand"><span class="mark">M</span> Pro Studio</div>
    <div class="sep"></div>
    <span class="proj">${state.view === 'workspace' && p ? esc(p.name) : 'Projects'}</span>
    <div class="spacer"></div>
    <a class="btn sm ghost" href="/developer">Beginner</a>
    <button type="button" class="btn sm ghost" data-act="profile">Profile</button>
    ${state.view === 'workspace' ? `
      <button type="button" class="btn sm ghost" data-act="debug">Debug</button>
      <button type="button" class="btn sm ghost" data-act="dash">All projects</button>
      <button type="button" class="btn sm ship" data-act="ship" ${state.shipping ? 'disabled' : ''}>Ship</button>
    ` : ''}
    <button type="button" class="btn sm primary" data-act="new">New</button>
  `;
  el.querySelector('[data-act="new"]')?.addEventListener('click', () => { state.modal = 'new'; state.modalName = ''; render(); });
  el.querySelector('[data-act="dash"]')?.addEventListener('click', () => { state.view = 'dash'; render(); });
  el.querySelector('[data-act="ship"]')?.addEventListener('click', () => { state.modal = 'ship'; render(); });
  el.querySelector('[data-act="profile"]')?.addEventListener('click', () => { state.modal = 'profile'; render(); });
  el.querySelector('[data-act="debug"]')?.addEventListener('click', () => runDebug());
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
  const mine = q ? state.projects.filter((p) => (p.name + p.tag + (p.desc || '')).toLowerCase().includes(q)) : state.projects;

  dash.innerHTML = `
    <h1>Pro workspace</h1>
    <p class="sub">Templates, full editor, GitHub, Vercel, Debug. Beginners use the simple flow at /developer.</p>
    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
      <button type="button" class="btn primary" data-act="new">New blank project</button>
      <button type="button" class="btn" data-act="profile">Profile & tokens</button>
      <input id="filter" placeholder="Filter…" value="${esc(state.filter)}"
        style="margin-left:auto;padding:8px 12px;border-radius:999px;border:1px solid var(--line);background:#fff;min-width:160px" />
    </div>
    <div class="section-t">Your projects (${mine.length})</div>
    <div class="cards" id="mine"></div>
    <div class="section-t">Templates (${SEED_PROJECTS.length})</div>
    <div class="cards" id="seeds"></div>
  `;

  const mineEl = dash.querySelector('#mine');
  if (!mine.length) {
    mineEl.innerHTML = '<p style="color:var(--ink-2)">No projects yet — open a template.</p>';
  } else {
    mine.forEach((p) => {
      const c = document.createElement('button');
      c.type = 'button';
      c.className = 'card';
      c.style.setProperty('--card-accent', p.color || '#f2622e');
      c.innerHTML = `<h3>${esc(p.name)}</h3><span class="tag">${esc(p.tag || 'Project')} · ${Object.keys(p.files).length} files</span><p>${esc(p.desc || '')}</p>`;
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
    c.innerHTML = `<h3>${esc(s.name)}</h3><span class="tag">${esc(s.tag)} · ${Object.keys(s.files).length} files</span><p>${esc(s.desc)}</p>`;
    c.addEventListener('click', () => createFromSeed(s));
    seedsEl.appendChild(c);
  });
  dash.querySelector('#filter')?.addEventListener('input', (e) => { state.filter = e.target.value; render(); });
  dash.querySelector('[data-act="new"]')?.addEventListener('click', () => { state.modal = 'new'; render(); });
  dash.querySelector('[data-act="profile"]')?.addEventListener('click', () => { state.modal = 'profile'; render(); });
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
  ;[['files','☰'],['debug','🐛']].forEach(([id, ico]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = ico;
    b.title = id;
    b.addEventListener('click', () => { if (id === 'debug') runDebug(); });
    rail.appendChild(b);
  });

  const panel = document.createElement('aside');
  panel.className = 'panel';
  panel.innerHTML = `<div class="panel-h"><span>Files</span><button type="button" class="btn sm" data-act="add">+</button></div>`;
  const body = document.createElement('div');
  body.className = 'panel-body';
  if (p) {
    pathsOf(p).forEach((path) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tree-item' + (state.activePath === path ? ' on' : '');
      b.textContent = path + (state.dirty.has(path) ? ' •' : '');
      b.addEventListener('click', () => {
        if (!state.openTabs.includes(path)) state.openTabs.push(path);
        state.activePath = path;
        render();
      });
      body.appendChild(b);
    });
  }
  panel.appendChild(body);
  panel.querySelector('[data-act="add"]')?.addEventListener('click', addFile);

  const main = document.createElement('div');
  main.className = 'main';
  const tabs = document.createElement('div');
  tabs.className = 'tabs';
  state.openTabs.forEach((path) => {
    const t = document.createElement('button');
    t.type = 'button';
    t.className = 'tab' + (state.activePath === path ? ' on' : '');
    t.textContent = path.split('/').pop() + (state.dirty.has(path) ? ' •' : '');
    t.addEventListener('click', () => { state.activePath = path; render(); });
    tabs.appendChild(t);
  });
  main.appendChild(tabs);

  if (state.debugOpen && state._debug) {
    const dbg = document.createElement('div');
    dbg.className = 'debug-panel';
    dbg.innerHTML = `<h4>Debug</h4><pre>${esc(JSON.stringify(state._debug, null, 2))}</pre>
      <button type="button" class="btn sm" style="margin-top:8px" data-act="closedbg">Close</button>`;
    dbg.querySelector('[data-act="closedbg"]').addEventListener('click', () => { state.debugOpen = false; render(); });
    main.appendChild(dbg);
  }

  const wrap = document.createElement('div');
  wrap.className = 'editor-wrap';
  const ta = document.createElement('textarea');
  ta.className = 'editor';
  ta.spellcheck = false;
  ta.value = p && state.activePath ? (p.files[state.activePath] ?? '') : '';
  ta.addEventListener('input', () => { if (state.activePath) setFileContent(state.activePath, ta.value); });
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = ta.selectionStart, en = ta.selectionEnd;
      ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(en);
      ta.selectionStart = ta.selectionEnd = s + 2;
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
  main.appendChild(wrap);

  const term = document.createElement('div');
  term.className = 'term';
  term.innerHTML = `<div class="term-h">Terminal</div><div class="term-out"></div>`;
  const out = term.querySelector('.term-out');
  state.termLines.forEach((line) => {
    const div = document.createElement('div');
    if (line.startsWith('[ok]')) div.className = 'ok';
    else if (line.startsWith('[err]')) div.className = 'err';
    div.textContent = line.replace(/^\[(ok|err|cmd)\]\s*/, '');
    out.appendChild(div);
  });
  out.scrollTop = out.scrollHeight;
  main.appendChild(term);

  shell.append(rail, panel, main);
  return shell;
}

function renderModal() {
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  if (state.modal === 'new') {
    bg.innerHTML = `<div class="modal"><h2>New blank project</h2><p class="sub">Vite + React starter.</p>
      <label>Name</label><input id="nm" value="${esc(state.modalName)}" placeholder="my-app" />
      <div class="modal-actions"><button type="button" class="btn ghost" data-act="cancel">Cancel</button>
      <button type="button" class="btn primary" data-act="go">Create</button></div></div>`;
    bg.querySelector('[data-act="go"]').addEventListener('click', () => {
      state.modalName = bg.querySelector('#nm').value; createBlank();
    });
  } else if (state.modal === 'ship') {
    bg.innerHTML = `<div class="modal"><h2>Ship</h2><p class="sub">Export or deploy with your tokens.</p>
      <button type="button" class="ship-opt" data-act="zip"><div><strong>Download ZIP</strong><br/><span style="color:var(--ink-2);font-size:12px">npm i && npm run dev</span></div></button>
      <button type="button" class="ship-opt" data-act="gh"><div><strong>Push to GitHub</strong><br/><span style="color:var(--ink-2);font-size:12px">${state.tokens.githubLogin ? '@' + esc(state.tokens.githubLogin) : 'Add token in Profile'}</span></div></button>
      <button type="button" class="ship-opt" data-act="vc"><div><strong>Deploy on Vercel</strong><br/><span style="color:var(--ink-2);font-size:12px">${state.tokens.vercelUser || 'Add token in Profile'}</span></div></button>
      <div class="modal-actions"><button type="button" class="btn ghost" data-act="cancel">Close</button></div></div>`;
    bg.querySelector('[data-act="zip"]').addEventListener('click', () => { state.modal = null; exportZip(); });
    bg.querySelector('[data-act="gh"]').addEventListener('click', () => pushGithub());
    bg.querySelector('[data-act="vc"]').addEventListener('click', () => deployVercel());
  } else if (state.modal === 'profile') {
    bg.innerHTML = `<div class="modal"><h2>Profile & settings</h2>
      <p class="sub">Tokens stay in this browser. Used only when you Ship.</p>
      <label>GitHub classic PAT (scope: repo)</label>
      <input id="gh" type="password" value="${esc(state.tokens.github)}" placeholder="ghp_…" autocomplete="off" />
      <label>Vercel token</label>
      <input id="vc" type="password" value="${esc(state.tokens.vercel)}" placeholder="…" autocomplete="off" />
      <label>Wallet (display only)</label>
      <input value="Connect Citizen wallet in the main app" disabled />
      <div class="modal-actions">
        <button type="button" class="btn ghost" data-act="cancel">Cancel</button>
        <button type="button" class="btn primary" data-act="save">Save</button>
      </div></div>`;
    bg.querySelector('[data-act="save"]').addEventListener('click', async () => {
      state.tokens.github = bg.querySelector('#gh').value.trim();
      state.tokens.vercel = bg.querySelector('#vc').value.trim();
      save();
      try {
        if (state.tokens.github) {
          const d = await shipApi({ action: 'github_whoami', token: state.tokens.github });
          state.tokens.githubLogin = d.login || '';
          log('GitHub @' + d.login, 'ok');
        }
        if (state.tokens.vercel) {
          const d = await shipApi({ action: 'vercel_whoami', token: state.tokens.vercel });
          state.tokens.vercelUser = d.user || d.email || '';
          log('Vercel ' + state.tokens.vercelUser, 'ok');
        }
        save();
      } catch (e) { log(e.message, 'err'); }
      state.modal = null; render();
    });
  }
  bg.querySelector('[data-act="cancel"]')?.addEventListener('click', () => { state.modal = null; render(); });
  bg.addEventListener('click', (e) => { if (e.target === bg) { state.modal = null; render(); } });
  return bg;
}

load();
render();
log(state.projects.length + ' projects · ' + SEED_PROJECTS.length + ' templates');
