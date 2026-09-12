/* Merveil Debug Circle — V1. Real project input + safe diagnosis. */
(() => {
  const emit = (name, detail = {}) => window.dispatchEvent(new CustomEvent(`merveil:${name}`, { detail }));
  let files = [];
  let overlay;

  function mount() {
    if (document.getElementById('merveil-debug-circle')) return;
    const host = document.createElement('div');
    host.id = 'merveil-debug-circle';
    host.innerHTML = `<button class="mdc-fab" aria-label="Open Merveil Debug">◉<span>Debug</span></button>`;
    document.body.appendChild(host);
    host.querySelector('button').onclick = open;
  }

  function open() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'mdc-overlay';
    overlay.innerHTML = `<div class="mdc-panel"><button class="mdc-close">×</button><div class="mdc-kicker">MERVEIL DEBUG V1</div><h2>Find the real problem.</h2><p>Put a project here. Merveil scans its structure and returns concrete issues before any repair.</p><label class="mdc-drop"><input id="mdc-files" type="file" multiple webkitdirectory directory /><strong>Select project folder</strong><span>Nothing is changed. Secrets are not uploaded intentionally.</span></label><div id="mdc-list" class="mdc-list">No project selected.</div><button id="mdc-scan" class="mdc-scan" disabled>Scan project →</button><div id="mdc-result" class="mdc-result"></div></div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.mdc-close').onclick = close;
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    overlay.querySelector('#mdc-files').onchange = e => loadFiles([...e.target.files]);
    overlay.querySelector('#mdc-scan').onclick = scan;
    emit('debug:opened', { source: 'debug-circle' });
  }

  function close() { overlay?.remove(); overlay = null; }

  async function loadFiles(input) {
    files = [];
    for (const file of input.slice(0, 180)) {
      if (file.size > 300000 || /(^|\/)node_modules(\/|$)/.test(file.webkitRelativePath || file.name)) continue;
      const path = file.webkitRelativePath || file.name;
      if (/\.(js|jsx|ts|tsx|json|css|html|md|sql|mjs|cjs|env|yml|yaml|py|java|vue)$/i.test(path)) {
        try { files.push({ path: path.replace(/^[^/]+\//, ''), content: await file.text() }); } catch {}
      }
    }
    const list = overlay?.querySelector('#mdc-list');
    if (list) list.innerHTML = files.length ? `<b>${files.length} files ready</b><br>${files.slice(0,8).map(f => `<span>${escapeHtml(f.path)}</span>`).join(' · ')}${files.length > 8 ? ' · …' : ''}` : 'No readable source files found.';
    const btn = overlay?.querySelector('#mdc-scan'); if (btn) btn.disabled = !files.length;
  }

  async function scan() {
    const result = overlay?.querySelector('#mdc-result');
    const btn = overlay?.querySelector('#mdc-scan');
    if (!result || !files.length) return;
    btn.disabled = true; btn.textContent = 'Scanning…'; result.innerHTML = '<div class="mdc-loading">Mapping project → checking structure → diagnosing issues</div>';
    try {
      const r = await fetch('/api/debug', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ files }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Debug service unavailable');
      const issueHtml = (data.issues || []).slice(0, 30).map(i => `<div class="mdc-issue ${escapeHtml(i.severity)}"><b>${escapeHtml(i.code)}</b><span>${escapeHtml(i.message)}</span>${i.file ? `<small>${escapeHtml(i.file)}${i.line ? `:${i.line}` : ''}</small>` : ''}</div>`).join('');
      result.innerHTML = `<div class="mdc-score"><strong>${data.score}</strong><span>/ 100<br>${escapeHtml(data.status)}</span></div><div class="mdc-summary">${data.filesScanned} files · ${data.counts.error} errors · ${data.counts.warn} warnings</div>${issueHtml || '<div class="mdc-ok">No issues detected by the V1 scanner.</div>'}<p class="mdc-safe">Diagnosis only. No files, database rows, auth state, or deployments were changed.</p>`;
      emit('debug:complete', data);
    } catch (e) { result.innerHTML = `<div class="mdc-error">${escapeHtml(e.message || 'Scan failed')}</div>`; }
    btn.disabled = false; btn.textContent = 'Scan again →';
  }
  const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  new MutationObserver(mount).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(mount, 600);
})();
