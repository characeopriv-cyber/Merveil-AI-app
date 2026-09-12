/* Merveil Debug Circle — Developer Platform pipeline V1.
 * Project → Diagnose → Proposal → Repair → Verify → Build Check → Deploy
 * Repair remains read-only until a real mutation service is explicitly added.
 */
(() => {
  const emit = (name, detail = {}) => window.dispatchEvent(new CustomEvent(`merveil:${name}`, { detail }));
  let files = [];
  let diagnosis = null;
  let verification = null;
  let buildCheck = null;
  let overlay;

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const headers = () => ({ 'Content-Type': 'application/json' });

  async function api(path, body) {
    const r = await fetch(path, { method: 'POST', credentials: 'include', headers: headers(), body: JSON.stringify(body || {}) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || `${path} failed (${r.status})`);
    return data;
  }

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
    overlay.innerHTML = `
      <div class="mdc-panel mdc-pipeline">
        <button class="mdc-close">×</button>
        <div class="mdc-kicker">MERVEIL DEVELOPER PLATFORM</div>
        <h2>Project health, before deploy.</h2>
        <p>Run the complete safe pipeline. Merveil diagnoses first, proposes repairs, verifies the result, then unlocks the build gate.</p>
        <div class="mdc-steps">
          <span data-step="project" class="active">1 Project</span><span data-step="diagnose">2 Diagnose</span><span data-step="proposal">3 Proposal</span><span data-step="repair">4 Repair</span><span data-step="verify">5 Verify</span><span data-step="build">6 Build</span><span data-step="deploy">7 Deploy</span>
        </div>
        <label class="mdc-drop"><input id="mdc-files" type="file" multiple webkitdirectory directory /><strong>Select project folder</strong><span>Read-only scan. node_modules and large files are skipped.</span></label>
        <div id="mdc-list" class="mdc-list">No project selected.</div>
        <div class="mdc-actions">
          <button id="mdc-scan" class="mdc-scan" disabled>1 · Diagnose project →</button>
          <button id="mdc-propose" class="mdc-secondary" disabled>2 · Generate proposal</button>
          <button id="mdc-repair" class="mdc-secondary" disabled>3 · Prepare repair</button>
          <button id="mdc-verify" class="mdc-secondary" disabled>4 · Verify current files</button>
          <button id="mdc-build" class="mdc-secondary" disabled>5 · Build check</button>
          <button id="mdc-deploy" class="mdc-deploy" disabled>6 · Deploy</button>
        </div>
        <div id="mdc-result" class="mdc-result"></div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.mdc-close').onclick = close;
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    overlay.querySelector('#mdc-files').onchange = e => loadFiles([...e.target.files]);
    overlay.querySelector('#mdc-scan').onclick = diagnoseProject;
    overlay.querySelector('#mdc-propose').onclick = makeProposal;
    overlay.querySelector('#mdc-repair').onclick = makeRepairPlan;
    overlay.querySelector('#mdc-verify').onclick = verifyProject;
    overlay.querySelector('#mdc-build').onclick = runBuildCheck;
    overlay.querySelector('#mdc-deploy').onclick = () => {
      const result = overlay?.querySelector('#mdc-result');
      if (!buildCheck?.ready) return;
      result.innerHTML = '<div class="mdc-ok"><b>Build gate passed.</b><br>Deployment is unlocked, but Merveil will not deploy automatically. Use the existing Publish/Deploy control after the verified build.</div>';
      emit('debug:deploy-ready', { buildCheck });
    };
    emit('debug:opened', { source: 'developer-pipeline' });
  }

  function close() { overlay?.remove(); overlay = null; }

  async function loadFiles(input) {
    files = [];
    diagnosis = null; verification = null; buildCheck = null;
    for (const file of input.slice(0, 180)) {
      if (file.size > 300000 || /(^|\/)node_modules(\/|$)/.test(file.webkitRelativePath || file.name)) continue;
      const path = file.webkitRelativePath || file.name;
      if (/\.(js|jsx|ts|tsx|json|css|html|md|sql|mjs|cjs|env|yml|yaml|py|java|vue)$/i.test(path)) {
        try { files.push({ path: path.replace(/^[^/]+\//, ''), content: await file.text() }); } catch {}
      }
    }
    const list = overlay?.querySelector('#mdc-list');
    if (list) list.innerHTML = files.length ? `<b>${files.length} source files ready</b><br>${files.slice(0,8).map(f => `<span>${esc(f.path)}</span>`).join(' · ')}${files.length > 8 ? ' · …' : ''}` : 'No readable source files found.';
    setEnabled('#mdc-scan', files.length > 0);
    setEnabled('#mdc-propose', false); setEnabled('#mdc-repair', false); setEnabled('#mdc-verify', false); setEnabled('#mdc-build', false); setEnabled('#mdc-deploy', false);
    setStep('project');
  }

  function setEnabled(sel, enabled) { const b = overlay?.querySelector(sel); if (b) b.disabled = !enabled; }
  function setStep(name) { overlay?.querySelectorAll('[data-step]').forEach(s => s.classList.toggle('active', s.dataset.step === name)); }
  function setBusy(sel, text) { const b = overlay?.querySelector(sel); if (b) { b.disabled = true; b.textContent = text; } }
  function resetButton(sel, text) { const b = overlay?.querySelector(sel); if (b) { b.disabled = false; b.textContent = text; } }

  async function diagnoseProject() {
    const result = overlay?.querySelector('#mdc-result'); if (!result || !files.length) return;
    setBusy('#mdc-scan', 'Diagnosing…'); result.innerHTML = '<div class="mdc-loading">Mapping project → checking structure → diagnosing issues</div>';
    try {
      diagnosis = await api('/api/debug', { action: 'diagnose', files });
      const counts = diagnosis.counts || { error: 0, warn: 0 };
      const issueHtml = (diagnosis.issues || []).slice(0, 30).map(i => `<div class="mdc-issue ${esc(i.severity)}"><b>${esc(i.code)}</b><span>${esc(i.message)}</span>${i.file ? `<small>${esc(i.file)}${i.line ? `:${i.line}` : ''}</small>` : ''}</div>`).join('');
      result.innerHTML = `<div class="mdc-score"><strong>${esc(diagnosis.score)}</strong><span>/ 100<br>${esc(diagnosis.status)}</span></div><div class="mdc-summary">${esc(diagnosis.filesScanned)} files · ${esc(counts.error)} errors · ${esc(counts.warn)} warnings</div>${issueHtml || '<div class="mdc-ok">No issues detected by the V1 scanner.</div>'}<p class="mdc-safe">Diagnosis is read-only.</p>`;
      setStep('diagnose'); setEnabled('#mdc-propose', true); setEnabled('#mdc-verify', true); emit('debug:complete', diagnosis);
    } catch (e) { result.innerHTML = `<div class="mdc-error">${esc(e.message || 'Diagnosis failed')}</div>`; }
    resetButton('#mdc-scan', '1 · Diagnose again →');
  }

  async function makeProposal() {
    const result = overlay?.querySelector('#mdc-result'); if (!diagnosis) return;
    setBusy('#mdc-propose', 'Preparing…');
    try {
      const data = await api('/api/debug', { action: 'propose', diagnosis });
      const proposals = data.proposals || [];
      result.innerHTML = `<div class="mdc-section-title">Repair proposals</div>${proposals.length ? proposals.map(p => `<div class="mdc-proposal"><b>${esc(p.id)} · ${esc(p.title || p.code)}</b><span>${esc(p.action || p.message || 'Review this issue')}</span><small>${esc(p.file || 'project-wide')} ${p.line ? `:${esc(p.line)}` : ''}</small></div>`).join('') : '<div class="mdc-ok">No repair proposals are needed.</div>'}<p class="mdc-safe">Proposals do not mutate project files.</p>`;
      setStep('proposal'); setEnabled('#mdc-repair', true); emit('debug:proposal', data);
    } catch (e) { result.innerHTML = `<div class="mdc-error">${esc(e.message || 'Proposal failed')}</div>`; }
    resetButton('#mdc-propose', '2 · Generate proposal');
  }

  async function makeRepairPlan() {
    const result = overlay?.querySelector('#mdc-result'); if (!diagnosis) return;
    setBusy('#mdc-repair', 'Preparing…');
    try {
      const data = await api('/api/debug', { action: 'repair', diagnosis });
      const plan = data.plan || [];
      result.innerHTML = `<div class="mdc-section-title">Safe repair plan</div>${plan.length ? plan.map(p => `<div class="mdc-proposal"><b>${esc(p.id || p.code)} · ${esc(p.status || 'review-required')}</b><span>${esc(p.action || p.message || 'Review before editing')}</span><small>${esc(p.file || 'project-wide')}</small></div>`).join('') : '<div class="mdc-ok">Nothing to repair.</div>'}<p class="mdc-safe"><b>No automatic mutation is performed.</b> Apply the approved changes in the project, then select the folder again and run Verify.</p>`;
      setStep('repair'); setEnabled('#mdc-verify', true); emit('debug:repair-plan', data);
    } catch (e) { result.innerHTML = `<div class="mdc-error">${esc(e.message || 'Repair plan failed')}</div>`; }
    resetButton('#mdc-repair', '3 · Prepare repair');
  }

  async function verifyProject() {
    const result = overlay?.querySelector('#mdc-result'); if (!files.length) return;
    setBusy('#mdc-verify', 'Verifying…'); result.innerHTML = '<div class="mdc-loading">Re-scanning current project and comparing against the last diagnosis</div>';
    try {
      const after = await api('/api/debug', { action: 'diagnose', files });
      verification = await api('/api/debug', { action: 'verify', before: diagnosis, after });
      const remaining = verification.remaining || [];
      result.innerHTML = `<div class="mdc-score"><strong>${esc(after.score)}</strong><span>/ 100<br>${esc(verification.status)}</span></div><div class="mdc-summary">Verified: ${esc(verification.verified?.length || 0)} · Remaining: ${esc(remaining.length)}</div>${remaining.length ? remaining.slice(0,20).map(i => `<div class="mdc-issue error"><b>${esc(i.code)}</b><span>${esc(i.message)}</span></div>`).join('') : '<div class="mdc-ok">All previously diagnosed issues are cleared.</div>'}<p class="mdc-safe">Verification is read-only.</p>`;
      setStep('verify'); setEnabled('#mdc-build', verification.status === 'Verified'); emit('debug:verified', verification);
    } catch (e) { result.innerHTML = `<div class="mdc-error">${esc(e.message || 'Verification failed')}</div>`; }
    resetButton('#mdc-verify', '4 · Verify current files');
  }

  async function runBuildCheck() {
    const result = overlay?.querySelector('#mdc-result'); if (!files.length) return;
    setBusy('#mdc-build', 'Checking…');
    try {
      buildCheck = await api('/api/build-check', { files, verification });
      const blockers = buildCheck.blockers || [];
      result.innerHTML = `<div class="mdc-score"><strong>${buildCheck.ready ? 'READY' : 'BLOCKED'}</strong><span>Build gate<br>${esc(buildCheck.status)}</span></div>${blockers.length ? `<div class="mdc-summary">Blockers: ${blockers.map(esc).join(' · ')}</div>` : '<div class="mdc-ok">Build gate passed. Run the real project build before deployment.</div>'}${(buildCheck.warnings || []).map(w => `<div class="mdc-issue warn"><b>WARNING</b><span>${esc(w)}</span></div>`).join('')}<p class="mdc-safe">Deployment stays locked until this gate is Ready.</p>`;
      setStep(buildCheck.ready ? 'deploy' : 'build'); setEnabled('#mdc-deploy', !!buildCheck.ready); emit('debug:build-check', buildCheck);
    } catch (e) { result.innerHTML = `<div class="mdc-error">${esc(e.message || 'Build check failed')}</div>`; }
    resetButton('#mdc-build', '5 · Build check');
  }

  new MutationObserver(mount).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(mount, 600);
})();
