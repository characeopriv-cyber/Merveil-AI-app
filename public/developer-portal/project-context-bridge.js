/* Merveil Developer Project Context Bridge
 * Keeps the active Developer Home project attached to Pro/Build requests.
 * Browser-only context; never invents provider credentials or repositories.
 */
(() => {
  const KEY = 'merveil:developer-project';
  const read = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
  };
  const save = (project, source) => {
    if (!project) return;
    const next = { ...project, source: source || project.source || 'workspace' };
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('merveil:project-context', { detail: { project: next, source: next.source } }));
  };

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    const isBuild = /\/api\/(engine\/generate|studio\/chat|debug|build-check)(?:\?|$)/.test(url);
    if (!isBuild) return originalFetch(input, init);

    const project = read();
    if (!project?.id) return originalFetch(input, init);

    const next = { ...init, headers: new Headers(init.headers || {}) };
    const method = String(next.method || (typeof input === 'object' && input?.method) || 'GET').toUpperCase();
    if (method === 'POST') {
      try {
        const raw = next.body;
        if (typeof raw === 'string') {
          const body = JSON.parse(raw || '{}');
          body.projectId = body.projectId || project.id;
          body.projectSource = body.projectSource || project.source || 'workspace';
          body.projectName = body.projectName || project.name || '';
          next.body = JSON.stringify(body);
          if (!next.headers.has('Content-Type')) next.headers.set('Content-Type', 'application/json');
        }
      } catch { /* preserve non-JSON requests */ }
    }
    return originalFetch(input, next);
  };

  function mount() {
    const root = document.getElementById('pro-root');
    if (!root || document.getElementById('merveil-project-context')) return;
    const project = read();
    const bar = document.createElement('div');
    bar.id = 'merveil-project-context';
    bar.style.cssText = 'position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;align-items:center;gap:8px;padding:7px 12px;border:1px solid rgba(0,0,0,.12);border-radius:999px;background:rgba(250,247,241,.94);backdrop-filter:blur(12px);font:12px/1.2 Inter,system-ui,sans-serif;color:#2a2824;box-shadow:0 6px 24px rgba(0,0,0,.08);pointer-events:auto';
    bar.innerHTML = project?.id
      ? `<span style="width:7px;height:7px;border-radius:50%;background:#2f6f68"></span><strong>${escapeHtml(project.name || 'Active project')}</strong><span style="opacity:.55">${escapeHtml(project.source || 'workspace')}</span><button type="button" style="border:0;background:transparent;cursor:pointer;font:inherit;opacity:.65" aria-label="Clear project">×</button>`
      : `<span style="opacity:.65">No active project</span><a href="/developer" style="color:inherit">Choose one in Developer Home</a>`;
    bar.querySelector('button')?.addEventListener('click', () => {
      localStorage.removeItem(KEY);
      window.dispatchEvent(new CustomEvent('merveil:project-context', { detail: { project: null, source: 'workspace' } }));
      mount();
    });
    root.appendChild(bar);
  }
  function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  window.addEventListener('merveil:project-context', e => { if (e.detail?.project) save(e.detail.project, e.detail.source); mount(); });
  const observer = new MutationObserver(mount);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(mount, 250);
})();
