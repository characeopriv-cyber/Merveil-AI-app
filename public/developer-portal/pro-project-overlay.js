/* Pro Studio project overlay.
 * Keeps the existing Pro IDE intact while replacing its starter workspace with
 * the authenticated active project's real persisted files. The existing editor
 * remains the editor; this layer synchronizes its visible filesystem to Supabase.
 */
(() => {
  if (window.__merveilProProjectOverlay) return;
  window.__merveilProProjectOverlay = true;
  const KEY = 'merveil:developer-project';
  const state = { project: null, files: [], active: '', loaded: false, saving: false };
  const project = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const headers = () => {
    const h = { 'content-type': 'application/json' };
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) || ''; if (!k.includes('auth-token')) continue;
        const raw = localStorage.getItem(k); if (!raw) continue; const j = JSON.parse(raw);
        const token = j?.access_token || j?.currentSession?.access_token; if (token) { h.authorization = `Bearer ${token}`; break; }
      }
    } catch {}
    return h;
  };
  const load = async () => {
    const p = project(); if (!p?.id) return false;
    if (state.loaded && state.project?.id === p.id) return true;
    const r = await fetch(`/api/developer-debug-project?projectId=${encodeURIComponent(p.id)}`, { credentials: 'include' });
    if (!r.ok) return false;
    const d = await r.json(); state.project = p; state.files = Array.isArray(d.files) ? d.files : [];
    state.active = state.files[0]?.path || ''; state.loaded = true; return true;
  };
  const save = async (path, content) => {
    if (!state.project?.id || !path || state.saving) return;
    state.saving = true;
    try {
      await fetch(`/api/developer-project-files?projectId=${encodeURIComponent(state.project.id)}`, { method:'POST', credentials:'include', headers:headers(), body:JSON.stringify({ projectId:state.project.id, files:[{path,content}]}) });
      const f = state.files.find(x => x.path === path); if (f) f.content = content;
    } finally { state.saving = false; }
  };
  const icon = (p) => /\.tsx?$/.test(p) ? 'TS' : /\.jsx?$/.test(p) ? 'JS' : /\.json$/.test(p) ? '{}' : /\.css$/.test(p) ? 'CSS' : /\.md$/.test(p) ? 'MD' : '·';
  const apply = () => {
    const root = document.getElementById('pro-root'); if (!root || !state.loaded) return;
    const filesBody = root.querySelector('.files-body');
    if (filesBody) {
      filesBody.innerHTML = state.files.map(f => `<div class="node ${state.active===f.path?'on':''}" data-merveil-path="${esc(f.path)}"><span class="node-ico">${icon(f.path)}</span><span class="node-name">${esc(f.path)}</span></div>`).join('') || '<div style="padding:16px;opacity:.6">Project has no files.</div>';
      filesBody.querySelectorAll('[data-merveil-path]').forEach(n => n.addEventListener('click', () => open(n.getAttribute('data-merveil-path'))));
    }
    const editor = root.querySelector('#editor'); const active = state.files.find(f => f.path === state.active);
    if (editor && active && editor.value !== String(active.content ?? '')) editor.value = String(active.content ?? '');
    const titleRepo = root.querySelector('.title-repo'); if (titleRepo && state.project?.name) titleRepo.textContent = state.project.name;
    const branch = root.querySelector('.title-branch'); if (branch) branch.textContent = '⌥ main';
  };
  const open = (path) => {
    const f = state.files.find(x => x.path === path); if (!f) return;
    state.active = path; apply();
    const editor = document.getElementById('editor'); if (editor) { editor.focus(); editor.selectionStart = editor.selectionEnd = editor.value.length; }
  };
  const watchEditor = () => {
    const editor = document.getElementById('editor'); if (!editor || editor.dataset.merveilProjectSync === '1') return;
    editor.dataset.merveilProjectSync = '1';
    editor.addEventListener('input', () => {
      const f = state.files.find(x => x.path === state.active); if (f) f.content = editor.value;
      clearTimeout(watchEditor.timer); watchEditor.timer = setTimeout(() => save(state.active, editor.value), 700);
    });
  };
  const boot = async () => {
    if (!project()?.id) return;
    try { if (await load()) { apply(); watchEditor(); } } catch {}
  };
  const observer = new MutationObserver(() => { if (state.loaded) { apply(); watchEditor(); } else boot(); });
  observer.observe(document.documentElement, { childList:true, subtree:true });
  window.addEventListener('merveil:project:active', () => { state.loaded = false; boot(); });
  setTimeout(boot, 600);
})();
