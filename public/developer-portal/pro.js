/**
 * Merveil Pro Studio — dense IDE shell
 * Editor: textarea (Monaco optional later). AI: /api/studio/chat or /api/engine/generate
 */
import { API_BASE } from './config.js';

const state = {
  rail: 'files',
  treeOpen: true,
  aiOpen: true,
  termOpen: true,
  bottomTab: 'terminal',
  aiMode: 'chat',
  files: /** @type {Record<string,string>} */ ({
    'README.md': '# Merveil Pro Studio\n\nEdit files, chat with AI, commit when GitHub is linked.\n',
    'src/App.tsx': `export default function App() {\n  return (\n    <main style={{ padding: 24, fontFamily: 'system-ui' }}>\n      <h1>Hello from Pro Studio</h1>\n      <p>Open AI panel · edit · save.</p>\n    </main>\n  );\n}\n`,
    'package.json': JSON.stringify({
      name: 'merveil-pro-app',
      private: true,
      type: 'module',
      scripts: { dev: 'vite', build: 'vite build' },
      dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
    }, null, 2),
  }),
  dirty: /** @type {Set<string>} */ (new Set()),
  openTabs: ['src/App.tsx'],
  activePath: 'src/App.tsx',
  termLines: ['Merveil Pro terminal ready.', 'Type help for commands.'],
  messages: [],
  filter: '',
  repo: 'local/workspace',
  branch: 'main',
  passport: null,
  cursor: { line: 1, col: 1 },
};

const root = document.getElementById('pro-root');

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function loadPassport() {
  try {
    const raw = localStorage.getItem('junction_user') || localStorage.getItem('merveil_user');
    if (raw) state.passport = JSON.parse(raw);
  } catch { /* */ }
}

function paths() {
  return Object.keys(state.files).sort((a, b) => a.localeCompare(b));
}

function iconFor(path) {
  if (/\.tsx?$/.test(path)) return 'TS';
  if (/\.jsx?$/.test(path)) return 'JS';
  if (/\.css$/.test(path)) return 'CSS';
  if (/\.json$/.test(path)) return '{}';
  if (/\.md$/.test(path)) return 'MD';
  return '·';
}

function render() {
  if (!root) return;
  root.innerHTML = '';
  const shell = document.createElement('div');
  shell.className = `pro ${state.aiOpen ? '' : 'no-ai'} ${state.treeOpen ? '' : 'no-files'}`.trim();
  shell.appendChild(renderTitle());
  shell.appendChild(renderRail());
  if (state.treeOpen) shell.appendChild(renderFiles());
  shell.appendChild(renderMain());
  if (state.aiOpen) shell.appendChild(renderAI());
  shell.appendChild(renderStatus());
  root.appendChild(shell);
  const ed = root.querySelector('#editor');
  if (ed) {
    ed.focus();
    ed.addEventListener('input', onEditorInput);
    ed.addEventListener('keyup', updateCursor);
    ed.addEventListener('click', updateCursor);
  }
}

function renderTitle() {
  const el = document.createElement('div');
  el.className = 'title';
  el.innerHTML = `
    <div class="title-brand"><span class="title-brand-mark"></span>Merveil Pro</div>
    <button type="button" class="title-repo" data-act="repo">${esc(state.repo)}</button>
    <span class="title-branch">⌥ ${esc(state.branch)}</span>
    <div class="title-spacer"></div>
    <span class="title-stat ${state.dirty.size ? 'add' : ''}">${state.dirty.size ? `+${state.dirty.size}` : 'clean'}</span>
    <button type="button" class="title-btn" data-act="toggle-ai">AI</button>
    <button type="button" class="title-btn primary" data-act="save" ${!state.dirty.size ? 'disabled' : ''}>Save</button>
    <a class="title-btn" href="/developer">Studio</a>
  `;
  el.querySelector('[data-act="toggle-ai"]')?.addEventListener('click', () => { state.aiOpen = !state.aiOpen; render(); });
  el.querySelector('[data-act="save"]')?.addEventListener('click', saveActive);
  el.querySelector('[data-act="repo"]')?.addEventListener('click', () => {
    state.termLines.push('GitHub OAuth: set GITHUB_CLIENT_ID and open /api/github/oauth (next slice).');
    state.bottomTab = 'terminal';
    render();
  });
  return el;
}

function renderRail() {
  const items = [['files', 'F'], ['search', 'S'], ['git', 'G'], ['ext', 'X'], ['settings', '⚙']];
  const el = document.createElement('nav');
  el.className = 'rail';
  items.forEach(([id, label]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `rail-btn ${state.rail === id ? 'on' : ''}`;
    b.textContent = label;
    b.title = id;
    b.addEventListener('click', () => {
      if (id === 'files') state.treeOpen = !state.treeOpen || state.rail !== 'files';
      state.rail = id;
      render();
    });
    el.appendChild(b);
  });
  const sp = document.createElement('div');
  sp.className = 'rail-spacer';
  el.appendChild(sp);
  return el;
}

function renderFiles() {
  const el = document.createElement('aside');
  el.className = 'files';
  const q = state.filter.toLowerCase();
  const list = paths().filter((p) => !q || p.toLowerCase().includes(q));
  el.innerHTML = `
    <div class="files-head"><span class="files-head-label">Explorer</span></div>
    <div class="files-search"><input id="file-filter" placeholder="Filter…" value="${esc(state.filter)}" /></div>
    <div class="files-body">
      ${list.map((p) => `
        <div class="node ${state.activePath === p ? 'on' : ''} ${state.dirty.has(p) ? 'dirty' : ''}" data-path="${esc(p)}">
          <span class="node-ico">${iconFor(p)}</span><span class="node-name">${esc(p)}</span>
        </div>`).join('')}
    </div>
  `;
  el.querySelector('#file-filter')?.addEventListener('input', (e) => {
    state.filter = e.target.value;
    render();
  });
  el.querySelectorAll('[data-path]').forEach((n) => n.addEventListener('click', () => openFile(n.getAttribute('data-path'))));
  return el;
}

function renderMain() {
  const el = document.createElement('div');
  el.className = `main ${state.termOpen ? '' : 'term-closed'}`.trim();
  const tabs = document.createElement('div');
  tabs.className = 'tabs';
  state.openTabs.forEach((p) => {
    const t = document.createElement('button');
    t.type = 'button';
    t.className = `tab ${state.activePath === p ? 'on' : ''} ${state.dirty.has(p) ? 'dirty' : ''}`;
    t.innerHTML = `<span class="tab-name">${esc(p.split('/').pop())}</span><span class="tab-close" data-close="${esc(p)}">×</span>`;
    t.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) {
        closeTab(p);
        return;
      }
      openFile(p);
    });
    tabs.appendChild(t);
  });
  el.appendChild(tabs);

  const editor = document.createElement('div');
  editor.className = 'editor';
  if (!state.activePath || !(state.activePath in state.files)) {
    editor.innerHTML = `<div class="editor-empty">Open a file from the explorer<br/><span class="editor-empty-kbd">⌘P</span></div>`;
  } else {
    const ta = document.createElement('textarea');
    ta.className = 'editor-area';
    ta.id = 'editor';
    ta.spellcheck = false;
    ta.value = state.files[state.activePath] || '';
    editor.appendChild(ta);
  }
  el.appendChild(editor);

  const bottom = document.createElement('div');
  bottom.className = 'bottom';
  bottom.innerHTML = `
    <div class="bottom-tabs">
      <button type="button" class="bottom-tab ${state.bottomTab === 'terminal' ? 'on' : ''}" data-btab="terminal">Terminal</button>
      <button type="button" class="bottom-tab ${state.bottomTab === 'problems' ? 'on' : ''}" data-btab="problems">Problems</button>
      <button type="button" class="bottom-tab ${state.bottomTab === 'git' ? 'on' : ''}" data-btab="git">Git</button>
      <div class="bottom-spacer"></div>
      <button type="button" class="bottom-tab" data-act="toggle-term">${state.termOpen ? '▾' : '▴'}</button>
    </div>
    <div class="bottom-body" style="${state.termOpen ? '' : 'display:none'}">
      ${state.bottomTab === 'terminal' ? `
        <div class="term-host" id="term-out">${state.termLines.map(esc).join('\n')}</div>
        <div class="term-input-row"><span>$</span><input id="term-in" placeholder="command" autocomplete="off" /></div>
      ` : state.bottomTab === 'git' ? `
        <div class="term-host">${[...state.dirty].map((p) => `M  ${esc(p)}`).join('\n') || 'working tree clean'}</div>
      ` : `<div class="term-host">No problems detected.</div>`}
    </div>
  `;
  bottom.querySelectorAll('[data-btab]').forEach((b) => b.addEventListener('click', () => {
    state.bottomTab = b.getAttribute('data-btab');
    state.termOpen = true;
    render();
  }));
  bottom.querySelector('[data-act="toggle-term"]')?.addEventListener('click', () => {
    state.termOpen = !state.termOpen;
    render();
  });
  bottom.querySelector('#term-in')?.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const v = e.target.value.trim();
    e.target.value = '';
    runTerm(v);
  });
  el.appendChild(bottom);
  return el;
}

function renderAI() {
  const el = document.createElement('aside');
  el.className = 'ai';
  const feedHtml = state.messages.length === 0
    ? `<div class="ai-empty"><strong>Elite engineer in the IDE</strong><br/>Ask for a change. Code blocks support Insert / Replace / New file.</div>`
    : state.messages.map((m, idx) => {
        const blocks = m.blocks || [];
        const codeHtml = blocks.map((b, bi) => `
      <div class="ai-code">
        <div class="ai-code-head">
          <span class="ai-code-path">${esc(b.path || state.activePath || 'snippet')}</span>
          <button type="button" class="ai-code-btn" data-insert="${idx}" data-bi="${bi}" data-op="insert">Insert</button>
          <button type="button" class="ai-code-btn primary" data-insert="${idx}" data-bi="${bi}" data-op="replace">Replace</button>
          <button type="button" class="ai-code-btn" data-insert="${idx}" data-bi="${bi}" data-op="new">New file</button>
        </div>
        <div class="ai-code-body">${esc((b.code || '').slice(0, 4000))}</div>
      </div>`).join('');
        return `<div class="ai-msg">
        <div class="ai-msg-head ${m.role === 'user' ? 'user' : ''}">${m.role === 'user' ? 'You' : 'Merveil'}</div>
        <div class="ai-msg-body">${esc(m.text || '')}</div>
        ${codeHtml}
      </div>`;
      }).join('');
  el.innerHTML = `
    <div class="ai-head">
      <span class="ai-head-orb"></span>
      <span class="ai-head-title">Merveil AI</span>
      <div class="ai-modes">
        ${['chat', 'edit', 'explain'].map((m) => `
          <button type="button" class="ai-mode-btn ${state.aiMode === m ? 'on' : ''}" data-mode="${m}">${m}</button>
        `).join('')}
      </div>
    </div>
    <div class="ai-feed" id="ai-feed">${feedHtml}</div>
    <div class="ai-in">
      <textarea id="ai-input" placeholder="Ask Merveil… (${state.aiMode})"></textarea>
      <div class="ai-in-tools">
        <button type="button" class="ai-in-send" id="ai-send">Send</button>
      </div>
    </div>
  `;
  el.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => {
    state.aiMode = b.getAttribute('data-mode');
    render();
  }));
  const send = () => {
    const ta = el.querySelector('#ai-input');
    const t = (ta?.value || '').trim();
    if (!t) return;
    sendAI(t);
  };
  el.querySelector('#ai-send')?.addEventListener('click', send);
  el.querySelector('#ai-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); }
  });
  el.querySelectorAll('[data-insert]').forEach((b) => {
    b.addEventListener('click', () => {
      const idx = Number(b.getAttribute('data-insert'));
      const bi = Number(b.getAttribute('data-bi') || 0);
      const block = state.messages[idx]?.blocks?.[bi];
      if (!block) return;
      const op = b.getAttribute('data-op');
      if (op === 'replace' && state.activePath) {
        state.files[state.activePath] = block.code;
        state.dirty.add(state.activePath);
      } else if (op === 'new') {
        const path = block.path || `src/generated-${Date.now()}.tsx`;
        state.files[path] = block.code;
        state.dirty.add(path);
        openFile(path);
        return;
      } else if (state.activePath) {
        const cur = state.files[state.activePath] || '';
        state.files[state.activePath] = cur + (cur.endsWith('\n') ? '' : '\n') + block.code;
        state.dirty.add(state.activePath);
      }
      render();
    });
  });
  return el;
}

function renderStatus() {
  const el = document.createElement('footer');
  el.className = 'status';
  el.innerHTML = `
    <span class="status-item">⌥ ${esc(state.branch)}</span>
    <span class="status-item">${state.dirty.size} changes</span>
    <div class="status-right">
      <span class="status-item">${esc(state.activePath || '—')}</span>
      <span class="status-item">Ln ${state.cursor.line}, Col ${state.cursor.col}</span>
      <span class="status-item">${esc(state.passport?.citizen_id || 'local')}</span>
    </div>
  `;
  return el;
}

function openFile(path) {
  if (!(path in state.files)) return;
  state.activePath = path;
  if (!state.openTabs.includes(path)) state.openTabs.push(path);
  render();
}

function closeTab(path) {
  state.openTabs = state.openTabs.filter((p) => p !== path);
  if (state.activePath === path) state.activePath = state.openTabs[state.openTabs.length - 1] || null;
  render();
}

function onEditorInput(e) {
  if (!state.activePath) return;
  state.files[state.activePath] = e.target.value;
  state.dirty.add(state.activePath);
  // light dirty indicator without full re-render
  document.querySelectorAll('.tab.on, .node.on').forEach((n) => n.classList.add('dirty'));
}

function updateCursor(e) {
  const ta = e?.target || document.getElementById('editor');
  if (!ta || ta.selectionStart == null) return;
  const upto = ta.value.slice(0, ta.selectionStart);
  const lines = upto.split('\n');
  state.cursor = { line: lines.length, col: lines[lines.length - 1].length + 1 };
  const st = document.querySelector('.status-right .status-item:nth-child(2)');
  if (st) st.textContent = `Ln ${state.cursor.line}, Col ${state.cursor.col}`;
}

function saveActive() {
  state.dirty.clear();
  state.termLines.push(`Saved ${Object.keys(state.files).length} files to local workspace.`);
  render();
}

function runTerm(cmd) {
  if (!cmd) return;
  state.termLines.push(`$ ${cmd}`);
  if (cmd === 'help') state.termLines.push('help · clear · ls · pwd · status');
  else if (cmd === 'clear') state.termLines = [];
  else if (cmd === 'ls') state.termLines.push(paths().join('\n'));
  else if (cmd === 'pwd') state.termLines.push('/workspace');
  else if (cmd === 'status') state.termLines.push(state.dirty.size ? [...state.dirty].map((p) => `M ${p}`).join('\n') : 'clean');
  else state.termLines.push(`command not found: ${cmd}`);
  render();
}

function parseCodeBlocks(text) {
  const blocks = [];
  const re = /```([^\n]*)\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(text))) {
    const tag = (m[1] || '').trim();
    const path = tag.includes('/') || /\.(tsx?|jsx?|css|json|md)$/.test(tag) ? tag : '';
    blocks.push({ path, code: m[2].replace(/\n$/, '') });
  }
  return blocks;
}

async function sendAI(message) {
  state.messages.push({ role: 'user', text: message, blocks: [] });
  render();
  const active = state.activePath ? { path: state.activePath, content: state.files[state.activePath] || '' } : null;
  try {
    let text = '';
    const res = await fetch(`${API_BASE || ''}/api/studio/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        mode: state.aiMode,
        message,
        activeFile: active,
        openFiles: state.openTabs.map((p) => ({ path: p })),
      }),
    });
    if (res.ok) text = await res.text();
    else {
      // fallback to engine generate
      const res2 = await fetch(`${API_BASE || ''}/api/engine/generate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          prompt: `${state.aiMode.toUpperCase()}: ${message}\n\nActive file ${active?.path || 'none'}:\n${(active?.content || '').slice(0, 4000)}`,
          mode: 'web_app',
        }),
      });
      text = await res2.text();
    }
    const blocks = parseCodeBlocks(text);
    // also try MF protocol
    const mf = text.matchAll(/<MF:BEGIN>\s*path:\s*(\S+)\s*<MF:BYTES>\s*([\s\S]*?)<MF:END>/g);
    for (const m of mf) blocks.push({ path: m[1], code: m[2].replace(/^\n/, '') });
    const prose = text.replace(/```[\s\S]*?```/g, '').replace(/<MF:BEGIN>[\s\S]*?<MF:END>/g, '').trim().slice(0, 1500);
    state.messages.push({ role: 'bot', text: prose || (blocks.length ? 'Proposed changes:' : text.slice(0, 800)), blocks });
  } catch (err) {
    state.messages.push({ role: 'bot', text: String(err.message || err), blocks: [] });
  }
  render();
}

window.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault();
    saveActive();
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
    e.preventDefault();
    state.treeOpen = true;
    state.rail = 'files';
    render();
    document.getElementById('file-filter')?.focus();
  }
});

loadPassport();
render();
