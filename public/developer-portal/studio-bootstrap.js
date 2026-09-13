/* Merveil Studio bootstrap — repair the legacy Studio source before parsing. */
(async () => {
  const showFailure = (err) => {
    const root = document.getElementById('root');
    if (root) root.innerHTML = '<div style="padding:32px;font:600 16px system-ui;color:#5a2a24">Merveil Developer Platform could not start. Please refresh.</div>';
    console.error('Merveil Studio bootstrap failed', err);
  };
  try {
    let source = await fetch('/developer-portal/studio.js', { cache: 'no-store' }).then((r) => r.text());
    // The legacy file contains one RegExp with a backslash followed by a real newline.
    // Normalize that parser-breaking sequence before importing the module.
    source = source.replace(/replace\(\/\^\\\n\//g, "replace(/^\\n/");
    source = source.replace("from './config.js'", "from '/developer-portal/config.js'");
    const blob = new Blob([source], { type: 'text/javascript' });
    await import(URL.createObjectURL(blob));
  } catch (err) {
    showFailure(err);
  }
})();
