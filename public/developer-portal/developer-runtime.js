/* Merveil Developer Runtime — shared project persistence/build bridge. */
(() => {
  if (window.__merveilDeveloperRuntime) return;
  window.__merveilDeveloperRuntime = true;
  const KEY = 'merveil:developer-project';
  const originalFetch = window.fetch.bind(window);
  const readProject = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } };
  const active = () => { const p = readProject(); return p?.id ? p : null; };
  const json = (v) => { try { return JSON.parse(v || '{}'); } catch { return {}; } };
  const postJson = (url, body) => originalFetch(url, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const mfFiles = (text) => {
    const out = []; const re = /<MF:BEGIN>\s*path:\s*(\S+)\s*<MF:BYTES>\s*([\s\S]*?)<MF:END>/g; let m;
    while ((m = re.exec(text || ''))) out.push({ path: m[1], content: m[2].replace(/^\n/, '') });
    return out;
  };

  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    const project = active();
    if (!project || !/\/api\/(engine\/generate|studio\/chat|debug|build-check)(?:\?|$)/.test(url)) return originalFetch(input, init);
    const next = { ...init, headers: new Headers(init.headers || {}) };
    const method = String(next.method || (typeof input === 'object' && input?.method) || 'GET').toUpperCase();
    if (method === 'POST' && typeof next.body === 'string') {
      const body = json(next.body);
      body.projectId = body.projectId || project.id;
      body.projectSource = body.projectSource || project.source || 'workspace';
      body.projectName = body.projectName || project.name || '';
      if (/\/api\/(debug|build-check)(?:\?|$)/.test(url) && !Array.isArray(body.files)) {
        try {
          const r = await originalFetch(`/api/developer-debug-project?projectId=${encodeURIComponent(project.id)}`, { credentials: 'include' });
          const d = await r.json(); if (r.ok && Array.isArray(d.files)) body.files = d.files;
        } catch {}
      }
      next.body = JSON.stringify(body); if (!next.headers.has('content-type')) next.headers.set('content-type', 'application/json');
    }
    const response = await originalFetch(input, next);
    if (/\/api\/engine\/generate(?:\?|$)/.test(url) && response.ok) {
      try {
        const text = await response.clone().text(); const files = mfFiles(text);
        if (files.length) {
          await postJson(`/api/developer-project-files?projectId=${encodeURIComponent(project.id)}`, { projectId: project.id, files });
          await postJson(`/api/developer-builds?projectId=${encodeURIComponent(project.id)}`, { projectId: project.id, status: 'success', logs: `Merveil generated and persisted ${files.length} files.` });
        }
      } catch {}
    }
    return response;
  };

  const runBuild = async () => {
    const p = active(); if (!p) return { ok: false, error: 'Choose an active developer project first.' };
    const r = await postJson('/api/developer-build-execution', { projectId: p.id, projectSource: p.source || 'workspace' });
    let data = {}; try { data = await r.json(); } catch {}
    return { ...data, httpStatus: r.status };
  };

  const mount = () => {
    const root = document.getElementById('root') || document.getElementById('pro-root');
    if (!root || document.getElementById('merveil-runtime-project')) return;
    const p = active();
    const bar = document.createElement('div'); bar.id = 'merveil-runtime-project';
    bar.style.cssText = 'position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:10000;display:flex;gap:8px;align-items:center;padding:6px 11px;border:1px solid rgba(0,0,0,.12);border-radius:999px;background:rgba(250,247,241,.96);backdrop-filter:blur(12px);font:12px Inter,system-ui,sans-serif;color:#292723;box-shadow:0 5px 20px rgba(0,0,0,.08)';
    bar.innerHTML = p?.id ? `<span style="width:7px;height:7px;border-radius:50%;background:#2f6f68"></span><strong>${String(p.name || 'Active project').replace(/[<>]/g,'')}</strong><span style="opacity:.55">${String(p.source || 'workspace').replace(/[<>]/g,'')}</span><button id="merveil-runtime-build" style="border:0;border-radius:999px;padding:4px 9px;background:#292723;color:#fff;cursor:pointer">Build</button>` : `<span style="opacity:.65">No active developer project</span><a href="/developer" style="color:inherit">Choose project</a>`;
    root.appendChild(bar);
    bar.querySelector('#merveil-runtime-build')?.addEventListener('click', async (e) => {
      const b = e.currentTarget; b.disabled = true; b.textContent = 'Building…';
      try {
        const result = await runBuild();
        b.textContent = result.ok ? 'Build passed' : 'Build failed';
        b.title = String(result.logs || result.error || '').slice(-2000);
        bar.style.borderColor = result.ok ? 'rgba(47,111,104,.45)' : 'rgba(170,60,60,.45)';
      } catch (err) { b.textContent = 'Build error'; b.title = String(err?.message || err); }
      setTimeout(() => { b.disabled = false; b.textContent = 'Build'; }, 3500);
    });
  };
  window.merveilDeveloperBuild = runBuild;
  new MutationObserver(mount).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(mount, 300);
})();
