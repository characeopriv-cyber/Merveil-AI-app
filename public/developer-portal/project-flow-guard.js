/* Merveil Developer Platform project-flow guard.
 * Keeps external-source selection and project-file persistence fail-closed.
 */
(() => {
  if (window.__merveilProjectFlowGuard) return;
  window.__merveilProjectFlowGuard = true;

  window.addEventListener('merveil:project:source', (event) => {
    const source = event.detail?.source;
    if (source !== 'github') return;
    let projectId = null;
    try { projectId = JSON.parse(localStorage.getItem('merveil:developer-project') || 'null')?.id || null; } catch {}
    if (!projectId) {
      alert('Choose or create an active project before connecting GitHub.');
      return;
    }
    window.location.href = `/api/github-oauth?action=start&projectId=${encodeURIComponent(projectId)}`;
  });

  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const response = await nativeFetch(...args);
    const request = args[0];
    const url = typeof request === 'string' ? request : request?.url || '';
    const options = args[1] || {};
    if (/\/api\/developer-project-files(?:\?|$)/.test(url) && String(options.method || 'GET').toUpperCase() !== 'GET') {
      if (!response.ok) {
        const body = await response.clone().json().catch(() => ({}));
        const error = new Error(body.error || `Project file save failed (${response.status})`);
        error.code = body.code || 'PROJECT_PERSIST_FAILED';
        window.dispatchEvent(new CustomEvent('merveil:generation:error', { detail: { code: error.code, message: error.message } }));
        throw error;
      }
    }
    return response;
  };
})();
