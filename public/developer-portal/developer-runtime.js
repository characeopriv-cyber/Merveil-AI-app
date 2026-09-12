/* Merveil Developer Runtime — shared project persistence and build bridge.
 * Developer Platform only. Keeps Build, Pro and Debug on one active project.
 * Real builds run in an isolated Vercel Sandbox; this runtime never executes
 * project code in the application server itself.
 */
(() => {
  if (window.__merveilDeveloperRuntime) return;
  window.__merveilDeveloperRuntime = true;
  const KEY = 'merveil:developer-project';
  const MAX_FILES = 300;
  const MAX_FILE_BYTES = 750000;
  const MAX_TOTAL_BYTES = 8000000;
  const readProject = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } };
  const json = (v) => { try { return JSON.parse(v || '{}'); } catch { return {}; } };
  const originalFetch = window.fetch.bind(window);
  const mfFiles = (text) => {
    const out = [];
    const re = /<MF:BEGIN>\s*path:\s*(\S+)\s*<MF:BYTES>\s*([\s\S]*?)<MF:END>/g;
    let m; while ((m = re.exec(text || ''))) out.push({ path: m[1], content: m[2].replace(/^\n/, '') });
    return out;
  };
  const validateGeneratedFiles = (files) => {
    if (!Array.isArray(files) || !files.length) return { ok: false, error: 'GENERATION_EMPTY' };
    if (files.length > MAX_FILES) return { ok: false, error: 'GENERATION_FILE_LIMIT' };
    const seen = new Set(); let total = 0;
    for (const f of files) {
      const path = String(f?.path || '').replace(/\\/g, '/').replace(/^\/+/, '');
      const content = String(f?.content || '');
      if (!path || path.split('/').includes('..') || /(^|\/)(\.env(?:\..*)?|.*\.(pem|key|p12|pfx))$/i.test(path)) return { ok: false, error: 'GENERATION_UNSAFE_PATH' };
      if (seen.has(path)) return { ok: false, error: 'GENERATION_DUPLICATE_PATH' };
      if (content.length > MAX_FILE_BYTES) return { ok: false, error: 'GENERATION_FILE_TOO_LARGE' };
      seen.add(path); total += content.length;
      if (total > MAX_TOTAL_BYTES) return { ok: false, error: 'GENERATION_TOTAL_TOO_LARGE' };
    }
    if (!seen.has('package.json')) return { ok: false, error: 'NO_MANIFEST' };
    if (!seen.has('index.html') && !seen.has('src/main.jsx') && !seen.has('src/main.tsx')) return { ok: false, error: 'ENTRY_NOT_FOUND' };
    return { ok: true };
  };
  const active = () => { const p = readProject(); return p?.id ? p : null; };
  const authToken = () => {
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i) || '';
        if (!key.includes('auth-token')) continue;
        const raw = localStorage.getItem(key); if (!raw) continue;
        const parsed = JSON.parse(raw);
        const token = parsed?.access_token || parsed?.currentSession?.access_token;
        if (token) return token;
      }
    } catch {}
    return '';
  };
  const postJson = (url, body) => originalFetch(url, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

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
      next.body = JSON.stringify(body);
      if (!next.headers.has('content-type')) next.headers.set('content-type', 'application/json');
    }
    const response = await originalFetch(input, next);
    if (/\/api\/engine\/generate(?:\?|$)/.test(url) && response.ok) {
      try {
        const text = await response.clone().text(); const files = mfFiles(text); const validation = validateGeneratedFiles(files);
        if (!validation.ok) {
          window.dispatchEvent(new CustomEvent('merveil:generation:blocked', { detail: validation }));
          return new Response(JSON.stringify({ error: 'Generated project failed validation.', code: validation.error }), { status: 422, headers: { 'content-type': 'application/json' } });
        }
        const token = authToken(); const headers = { 'content-type': 'application/json' }; if (token) headers.authorization = `Bearer ${token}`;
        const checkResponse = await originalFetch('/api/build-check', { method: 'POST', credentials: 'include', headers, body: JSON.stringify({ projectId: project.id, files }) });
        const check = await checkResponse.json().catch(() => ({}));
        if (!checkResponse.ok || !check.ready) {
          window.dispatchEvent(new CustomEvent('merveil:generation:blocked', { detail: { error: 'BUILD_CHECK_BLOCKED', check } }));
          return new Response(JSON.stringify({ error: 'Generated project was blocked by Build Check.', code: 'BUILD_CHECK_BLOCKED', check }), { status: 422, headers: { 'content-type': 'application/json' } });
        }
        const persistResponse = await postJson(`/api/developer-project-files?projectId=${encodeURIComponent(project.id)}`, { projectId: project.id, files });
        const persist = await persistResponse.json().catch(() => ({}));
        if (!persistResponse.ok) {
          window.dispatchEvent(new CustomEvent('merveil:generation:error', { detail: { error: 'PROJECT_PERSIST_FAILED', persist } }));
          return new Response(JSON.stringify({ error: 'Generated project could not be persisted.', code: 'PROJECT_PERSIST_FAILED', persist }), { status: 422, headers: { 'content-type': 'application/json' } });
        }
        window.dispatchEvent(new CustomEvent('merveil:generation:persisted', { detail: { projectId: project.id, files: files.length, check, persist } }));
      } catch (e) {
        window.dispatchEvent(new CustomEvent('merveil:generation:error', { detail: { error: e?.message || String(e) } }));
      }
    }
    return response;
  };

  const buildCheck = async () => {
    const p = active(); if (!p) return { ready: false, error: 'Choose an active developer project first.' };
    try {
      const headers = { 'content-type': 'application/json' }; const token = authToken();
      if (token) headers.authorization = `Bearer ${token}`;
      const r = await originalFetch('/api/build-check', { method: 'POST', credentials: 'include', headers, body: JSON.stringify({ projectId: p.id }) });
      const d = await r.json(); return { ...d, httpStatus: r.status };
    } catch (e) { return { ready: false, error: e?.message || String(e) }; }
  };

  const sandboxBuild = async () => {
    const p = active(); if (!p) return { ok: false, status: 'blocked', error: 'Choose an active developer project first.' };
    const check = await buildCheck();
    if (!check.ready) return { ok: false, status: 'blocked', error: 'Build Check blocked the sandbox build.', check };
    try {
      const headers = { 'content-type': 'application/json' }; const token = authToken();
      if (token) headers.authorization = `Bearer ${token}`;
      const r = await originalFetch('/api/developer-sandbox-build', { method: 'POST', credentials: 'include', headers, body: JSON.stringify({ projectId: p.id, buildCheckId: check.id || null }) });
      const d = await r.json().catch(() => ({}));
      return { ...d, httpStatus: r.status, check };
    } catch (e) { return { ok: false, status: 'failed', error: e?.message || String(e), check }; }
  };

  const mount = () => {
    const root = document.getElementById('root') || document.getElementById('pro-root');
    if (!root || document.getElementById('merveil-runtime-project')) return;
    const p = active(); const bar = document.createElement('div'); bar.id = 'merveil-runtime-project';
    bar.style.cssText = 'position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:10000;display:flex;gap:8px;align-items:center;padding:6px 11px;border:1px solid rgba(0,0,0,.12);border-radius:999px;background:rgba(250,247,241,.96);backdrop-filter:blur(12px);font:12px Inter,system-ui,sans-serif;color:#292723;box-shadow:0 5px 20px rgba(0,0,0,.08)';
    const safe = (v) => String(v || '').replace(/[<>]/g, '');
    bar.innerHTML = p?.id
      ? `<span style="width:7px;height:7px;border-radius:50%;background:#2f6f68"></span><strong>${safe(p.name || 'Active project')}</strong><span style="opacity:.55">${safe(p.source || 'workspace')}</span><button id="merveil-runtime-check" style="border:0;border-radius:999px;padding:4px 9px;background:#292723;color:#fff;cursor:pointer">Build check</button><button id="merveil-runtime-build" style="border:0;border-radius:999px;padding:4px 9px;background:#2f6f68;color:#fff;cursor:pointer">Build in Sandbox</button>`
      : `<span style="opacity:.65">No active developer project</span><a href="/developer" style="color:inherit">Choose project</a>`;
    root.appendChild(bar);
    bar.querySelector('#merveil-runtime-check')?.addEventListener('click', async (e) => {
      const b = e.currentTarget; b.disabled = true; b.textContent = 'Checking…';
      const result = await buildCheck();
      b.textContent = result.ready ? 'Ready' : 'Blocked'; b.title = result.ready ? `Ready — ${(result.warnings || []).length} warnings.` : `Blocked — ${(result.blockers || [result.error || 'Build check failed']).join(', ')}`;
      setTimeout(() => { b.disabled = false; b.textContent = 'Build check'; }, 3500);
    });
    bar.querySelector('#merveil-runtime-build')?.addEventListener('click', async (e) => {
      const b = e.currentTarget; b.disabled = true; b.textContent = 'Building…';
      const result = await sandboxBuild();
      b.textContent = result.status === 'success' ? 'Build passed' : result.status === 'blocked' ? 'Blocked' : 'Build failed';
      b.title = result.error || result.build?.logs || result.error || 'Sandbox build finished';
      bar.style.borderColor = result.status === 'success' ? 'rgba(47,111,104,.45)' : 'rgba(170,60,60,.45)';
      setTimeout(() => { b.disabled = false; b.textContent = 'Build in Sandbox'; }, 5000);
      window.dispatchEvent(new CustomEvent('merveil:build:finished', { detail: result }));
    });
  };

  window.merveilDeveloperBuildCheck = buildCheck;
  window.merveilDeveloperSandboxBuild = sandboxBuild;
  new MutationObserver(mount).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(mount, 300);
})();
