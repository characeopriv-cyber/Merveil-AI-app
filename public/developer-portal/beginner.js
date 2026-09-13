/**
 * Merveil Beginner V7 — circular prompt, cyan, real HTML generation, visual edit, passport
 */
import { API_BASE } from './config.js';
import {
  loadPassport, savePassport, generateProject, loadProjects,
} from './generate-engine.js';

const CATS = [
  { id: 'website', label: 'Websites', desc: 'Landing & brand sites', icon: '◈' },
  { id: 'mobile', label: 'Mobile Apps', desc: 'App-style prototypes', icon: '▦' },
  { id: 'game', label: '3D / Games', desc: 'Playable HTML5', icon: '✦' },
  { id: 'photo_video', label: 'Photo / Video', desc: 'Labs & showreels', icon: '◉' },
  { id: 'portfolio', label: 'Portfolios', desc: 'Creator showcases', icon: '◇' },
  { id: 'ecommerce', label: 'E-commerce', desc: 'Shops & catalogs', icon: '▣' },
];

const state = {
  screen: 'home',
  prompt: '',
  kind: 'website',
  boost: true,
  passport: loadPassport(),
  project: null,
  html: '',
  mode: 'preview', // preview | edit
  sheet: null, // export | passport | null
  genLabel: '',
  toast: '',
  attachment: null,
};

const app = document.getElementById('app');

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

function toast(msg) {
  state.toast = msg;
  render();
  setTimeout(() => { if (state.toast === msg) { state.toast = ''; render(); } }, 2800);
}

async function startGenerate() {
  const prompt = state.prompt.trim();
  if (!prompt) { toast('Describe what you want to build'); return; }
  // Require minimal passport for injection quality
  if (!state.passport.company_name && !state.passport.full_name) {
    state.sheet = 'passport';
    state._pendingGenerate = true;
    render();
    toast('Add your Digital Passport details first');
    return;
  }
  state.screen = 'generating';
  state.genLabel = state.boost ? 'Merveil Boost running…' : 'Building your product…';
  render();

  try {
    const { project, html, deployment } = await generateProject({
      prompt,
      type: state.kind,
      passport: state.passport,
      boost: state.boost,
      onProgress: (s) => { state.genLabel = s === 'Boost' ? 'Merveil Boost…' : s === 'Generate' ? 'Writing real HTML…' : 'Finishing…'; render(); },
    });
    state.project = project;
    state.html = html;
    state.deployment = deployment;
    state.screen = 'result';
    state.mode = 'preview';
  } catch (e) {
    toast(e.message || 'Generation failed');
    state.screen = 'home';
  }
  render();
}

function exportZip(html, title) {
  const files = {
    'index.html': html,
    'README.md': `# ${title}\n\nGenerated with Merveil Beginner.\nOpen index.html or upload to GoDaddy / Namecheap.\n`,
  };
  const enc = new TextEncoder();
  const parts = [], central = [];
  let offset = 0;
  function crc32(buf) {
    let c = ~0;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
    return ~c >>> 0;
  }
  for (const [name, text] of Object.entries(files)) {
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
  ev.setUint16(8, 2, true);
  ev.setUint16(10, 2, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  const blob = new Blob([...parts, ...central, end], { type: 'application/zip' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${(title || 'project').replace(/\s+/g, '-').toLowerCase()}.zip`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function render() {
  if (!app) return;
  app.innerHTML = '';
  app.appendChild(renderNav());
  if (state.screen === 'home') app.appendChild(renderHome());
  else if (state.screen === 'generating') app.appendChild(renderGen());
  else app.appendChild(renderResult());
  if (state.sheet === 'passport') app.appendChild(renderPassport());
  if (state.sheet === 'export') app.appendChild(renderExport());
  if (state.toast) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = state.toast;
    app.appendChild(t);
  }
}

function renderNav() {
  const nav = document.createElement('header');
  nav.className = 'nav';
  nav.innerHTML = `
    <div class="brand"><span class="mark"></span> Merveil</div>
    <div class="nav-right">
      <button type="button" class="nav-link" data-act="passport">Digital Passport</button>
      ${state.screen !== 'home' ? '<button type="button" class="nav-link" data-act="home">New idea</button>' : ''}
      <a class="nav-link pro" href="/developer/pro">Pro mode</a>
    </div>`;
  nav.querySelector('[data-act="passport"]')?.addEventListener('click', () => { state.sheet = 'passport'; render(); });
  nav.querySelector('[data-act="home"]')?.addEventListener('click', () => { state.screen = 'home'; state.sheet = null; render(); });
  return nav;
}

function renderHome() {
  const el = document.createElement('main');
  el.className = 'home';
  el.innerHTML = `
    <h1>What will you build?</h1>
    <p class="sub">Type an idea. Get a real product — editable, deployable.</p>
    <label class="boost-row">
      <input type="checkbox" id="boost" ${state.boost ? 'checked' : ''}/>
      Merveil Boost on every prompt
    </label>
    <div class="circle-wrap">
      <div class="circle-ring">
        <textarea id="prompt" placeholder="Interior design website for Dubai real estate…">${esc(state.prompt)}</textarea>
        <div class="circle-actions">
          <button type="button" class="attach" id="attach" title="Attach image or video">＋</button>
          <button type="button" class="btn-start" id="start">Start →</button>
        </div>
        <input type="file" id="file" accept="image/*,video/*" hidden />
      </div>
    </div>
    <div class="cats" id="cats">
      ${CATS.map((c) => `
        <button type="button" class="cat ${state.kind === c.id ? 'on' : ''}" data-kind="${c.id}">
          <div class="ico">${c.icon}</div>
          <strong>${c.label}</strong>
          <span>${c.desc}</span>
        </button>`).join('')}
    </div>`;
  el.querySelector('#prompt').addEventListener('input', (e) => { state.prompt = e.target.value; });
  el.querySelector('#boost').addEventListener('change', (e) => { state.boost = e.target.checked; });
  el.querySelectorAll('[data-kind]').forEach((b) => {
    b.addEventListener('click', () => { state.kind = b.getAttribute('data-kind'); render(); });
  });
  el.querySelector('#start').addEventListener('click', () => {
    state.prompt = el.querySelector('#prompt').value;
    startGenerate();
  });
  el.querySelector('#attach').addEventListener('click', () => el.querySelector('#file').click());
  el.querySelector('#file').addEventListener('change', (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    state.attachment = f.name;
    toast('Attached ' + f.name);
  });
  return el;
}

function renderGen() {
  const el = document.createElement('main');
  el.className = 'gen';
  el.innerHTML = `
    <div class="orb"></div>
    <h2>Building a real product</h2>
    <p>${esc(state.prompt.slice(0, 120))}</p>
    <div class="boost-tag">${esc(state.genLabel)}</div>`;
  return el;
}

function renderResult() {
  const el = document.createElement('main');
  el.className = 'result-shell';
  const title = state.project?.title || 'Project';
  el.innerHTML = `
    <div class="result-bar">
      <h2>${esc(title)}</h2>
      <span class="chip">${state.project?.boost_score ? 'Boost ' + state.project.boost_score : 'Ready'}</span>
      <div class="mode-tabs">
        <button type="button" class="${state.mode === 'preview' ? 'on' : ''}" data-mode="preview">Preview</button>
        <button type="button" class="${state.mode === 'edit' ? 'on' : ''}" data-mode="edit">Edit my project</button>
      </div>
      <button type="button" class="btn ghost" data-act="home">New</button>
      <button type="button" class="btn primary" data-act="export">Export / Deploy</button>
    </div>
    <div class="preview-frame">
      <div class="preview-chrome">
        <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
        <span style="margin-left:8px;font-size:12px;color:#8b919c">${state.mode === 'edit' ? 'Click any text or image to edit' : 'Live prototype'}</span>
      </div>
      <iframe id="preview" sandbox="allow-scripts allow-same-origin allow-forms" title="Prototype"></iframe>
    </div>`;
  el.querySelectorAll('[data-mode]').forEach((b) => {
    b.addEventListener('click', () => { state.mode = b.getAttribute('data-mode'); render(); });
  });
  el.querySelector('[data-act="home"]').addEventListener('click', () => { state.screen = 'home'; render(); });
  el.querySelector('[data-act="export"]').addEventListener('click', () => { state.sheet = 'export'; render(); });
  const iframe = el.querySelector('#preview');
  requestAnimationFrame(() => {
    let html = state.html;
    if (state.mode === 'edit') {
      // ensure editable
      html = html.replace('</body>', `<style>[data-edit]{outline:1px dashed #3fe0e8!important;cursor:text}[data-img]{cursor:pointer;outline:1px dashed #3fe0e8}</style>
<script>
document.querySelectorAll('[data-edit]').forEach(el=>{el.contentEditable='true';});
document.querySelectorAll('[data-img]').forEach(el=>{
  el.addEventListener('click',()=>{const u=prompt('Image URL',el.src||'');if(u)el.src=u;});
});
document.querySelectorAll('img:not([data-img])').forEach(el=>{
  el.addEventListener('click',()=>{const u=prompt('Image URL',el.src||'');if(u)el.src=u;});
});
<\/script></body>`);
    }
    iframe.srcdoc = html;
    // persist edits when leaving edit mode
    iframe.addEventListener('load', () => {
      try {
        const doc = iframe.contentDocument;
        if (!doc) return;
        const obs = new MutationObserver(() => {
          state.html = '<!DOCTYPE html>' + doc.documentElement.outerHTML;
          if (state.project) state.project.generated_code = state.html;
        });
        obs.observe(doc.body, { subtree: true, characterData: true, childList: true, attributes: true });
      } catch { /* */ }
    });
  });
  return el;
}

function renderPassport() {
  const p = state.passport;
  const bg = document.createElement('div');
  bg.className = 'sheet-bg';
  bg.innerHTML = `
    <div class="sheet">
      <h3>Digital Passport</h3>
      <p>Injected into every generated project — header, footer, contact.</p>
      <label>Full name</label><input id="full_name" value="${esc(p.full_name)}"/>
      <label>Company name</label><input id="company_name" value="${esc(p.company_name)}"/>
      <label>CEO name</label><input id="ceo_name" value="${esc(p.ceo_name)}"/>
      <label>Email</label><input id="email" type="email" value="${esc(p.email)}"/>
      <label>Website</label><input id="website" value="${esc(p.website)}"/>
      <label>Location</label><input id="location" value="${esc(p.location)}"/>
      <label>Socials</label><input id="socials" value="${esc(p.socials)}"/>
      <label>Team contacts</label><textarea id="team_contacts" rows="2">${esc(p.team_contacts)}</textarea>
      <div class="sheet-actions">
        <button type="button" class="btn ghost" data-act="close">Close</button>
        <button type="button" class="btn primary" data-act="save">Save</button>
      </div>
    </div>`;
  bg.addEventListener('click', (e) => { if (e.target === bg) { state.sheet = null; render(); } });
  bg.querySelector('[data-act="close"]').addEventListener('click', () => { state.sheet = null; render(); });
  bg.querySelector('[data-act="save"]').addEventListener('click', () => {
    const fields = ['full_name','company_name','ceo_name','email','website','location','socials','team_contacts'];
    fields.forEach((f) => { state.passport[f] = bg.querySelector('#' + f).value.trim(); });
    savePassport(state.passport);
    state.sheet = null;
    toast('Passport saved');
    if (state._pendingGenerate) {
      state._pendingGenerate = false;
      startGenerate();
    } else render();
  });
  return bg;
}

function renderExport() {
  const opts = state.deployment || state.project?.deployment_options || ['Download ZIP', 'GoDaddy', 'Namecheap'];
  const bg = document.createElement('div');
  bg.className = 'sheet-bg';
  bg.innerHTML = `
    <div class="sheet">
      <h3>Export & deploy</h3>
      <p>Real HTML file — upload to any static host.</p>
      <div class="opts">
        ${opts.map((o) => `<button type="button" class="opt" data-opt="${esc(o)}"><div><strong>${esc(o)}</strong><span>${
          o.includes('ZIP') || o.includes('Download') ? 'Get the project files' :
          o.includes('GitHub') ? 'Open Pro mode to push' :
          o.includes('Vercel') ? 'Open Pro mode to deploy' :
          o.includes('Itch') ? 'Upload index.html to itch.io' :
          'Download ZIP then upload via their file manager'
        }</span></div></button>`).join('')}
        <button type="button" class="opt" data-opt="html"><div><strong>Download HTML</strong><span>Single file</span></div></button>
        <button type="button" class="opt" data-opt="pro"><div><strong>Open in Pro Studio</strong><span>Full IDE, GitHub, Vercel</span></div></button>
      </div>
      <div class="sheet-actions"><button type="button" class="btn ghost" data-act="close">Close</button></div>
    </div>`;
  bg.addEventListener('click', (e) => { if (e.target === bg) { state.sheet = null; render(); } });
  bg.querySelector('[data-act="close"]').addEventListener('click', () => { state.sheet = null; render(); });
  bg.querySelectorAll('[data-opt]').forEach((b) => {
    b.addEventListener('click', () => {
      const o = b.getAttribute('data-opt');
      if (o === 'html') {
        const blob = new Blob([state.html], { type: 'text/html' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = (state.project?.title || 'site').replace(/\s+/g, '-').toLowerCase() + '.html';
        a.click();
        toast('HTML downloaded');
      } else if (o.includes('ZIP') || o.includes('Download') || o.includes('GoDaddy') || o.includes('Namecheap') || o.includes('Itch')) {
        exportZip(state.html, state.project?.title);
        toast(o.includes('GoDaddy') || o.includes('Namecheap') ? 'ZIP ready — upload index.html in your host file manager' : 'ZIP downloaded');
      } else if (o.includes('GitHub') || o.includes('Vercel') || o === 'pro') {
        try {
          const id = 'beg-' + Date.now();
          const projects = JSON.parse(localStorage.getItem('merveil_dev_projects_v5') || '[]');
          projects.unshift({
            id, name: state.project?.title || 'Beginner project', tag: state.project?.project_type || 'website',
            desc: state.prompt, color: '#3fe0e8',
            files: { 'index.html': state.html, 'README.md': '# ' + (state.project?.title || 'Project') },
            createdAt: Date.now(), updatedAt: Date.now(),
          });
          localStorage.setItem('merveil_dev_projects_v5', JSON.stringify(projects));
          localStorage.setItem('merveil_dev_active_v5', id);
        } catch { /* */ }
        location.href = '/developer/pro';
        return;
      }
      state.sheet = null;
      render();
    });
  });
  return bg;
}

render();
