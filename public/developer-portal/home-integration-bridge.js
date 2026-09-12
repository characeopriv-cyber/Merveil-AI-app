/* Merveil Developer Home integration bridge.
 * Converts real provider-ready events into provider flows; never fabricates a connection.
 */
(() => {
  if (window.__merveilHomeIntegrationBridge) return;
  window.__merveilHomeIntegrationBridge = true;
  window.addEventListener('merveil:integration:connect:ready', (event) => {
    const { key, name } = event.detail || {};
    if (!key) return;
    if (key === 'github') {
      let projectId = null;
      try { projectId = JSON.parse(localStorage.getItem('merveil:developer-project') || 'null')?.id || null; } catch {}
      if (!projectId) {
        alert('Choose or create an active project before connecting GitHub.');
        return;
      }
      window.location.href = `/api/github-oauth?action=start&projectId=${encodeURIComponent(projectId)}`;
      return;
    }
    if (key === 'vercel') {
      window.dispatchEvent(new CustomEvent('merveil:provider:oauth', { detail: { key, name, projectId } }));
      return;
    }
    window.dispatchEvent(new CustomEvent('merveil:provider:connect', { detail: { key, name } }));
  });
})();
