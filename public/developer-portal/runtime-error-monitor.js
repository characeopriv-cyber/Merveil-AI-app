/* Merveil Developer Platform — visible runtime failure monitor. */
(() => {
  if (window.__merveilRuntimeErrorMonitor) return;
  window.__merveilRuntimeErrorMonitor = true;

  const show = (message) => {
    let bar = document.getElementById('merveil-runtime-error');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'merveil-runtime-error';
      bar.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:20000;display:flex;gap:10px;align-items:center;justify-content:space-between;padding:11px 13px;border:1px solid rgba(150,45,45,.22);border-radius:14px;background:rgba(255,249,246,.97);box-shadow:0 12px 30px rgba(40,20,15,.14);font:12px Inter,system-ui,sans-serif;color:#5b2520';
      document.body.appendChild(bar);
    }
    bar.innerHTML = `<span><strong>Merveil Developer Platform error</strong> · ${String(message || 'Unexpected runtime failure').replace(/[<>]/g, '')}</span><button type="button" style="border:0;border-radius:9px;padding:6px 9px;background:#5b2520;color:#fff;cursor:pointer">Dismiss</button>`;
    bar.querySelector('button').onclick = () => bar.remove();
  };

  window.addEventListener('error', (event) => {
    const message = event?.error?.message || event?.message;
    if (message) show(message);
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const message = reason?.message || String(reason || 'Unhandled promise rejection');
    show(message);
  });
})();
