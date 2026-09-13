/* Merveil Studio bootstrap — load studio module; isolate optional platform scripts. */
(async () => {
  const showFailure = (err) => {
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `<div style="padding:32px;font:600 16px system-ui;color:#5a2a24">
        Merveil Developer Platform could not start.<br/>
        <span style="font-weight:500;color:#7a4538">${String(err?.message || err)}</span>
      </div>`;
    }
    console.error('Merveil Studio bootstrap failed', err);
  };

  try {
    // Preferred: static import path
    await import('/developer-portal/studio.js');
  } catch (err) {
    // Fallback: fetch + normalize legacy bad regex escape then blob-import
    try {
      let source = await fetch('/developer-portal/studio.js', { cache: 'no-store' }).then((r) => r.text());
      source = source.replace(/replace\(\/\^\\\n\//g, "replace(/^\\n/");
      source = source.replace("from './config.js'", "from '/developer-portal/config.js'");
      const blob = new Blob([source], { type: 'text/javascript' });
      await import(URL.createObjectURL(blob));
    } catch (err2) {
      showFailure(err2);
    }
  }
})();
