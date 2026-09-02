/* Merveil Arena audio reliability guard.
 * Loaded by the root service worker after each Arena document.
 * Keeps Web Audio alive across mobile browser visibility/autoplay transitions
 * and provides a native fallback tone when the embedded ArenaAudio engine is
 * unavailable or suspended.
 */
(() => {
  const path = location.pathname.toLowerCase();
  const kind = path.includes('burj-rise') ? 'burj' : path.includes('connecta') ? 'connecta' : 'sahra';
  let fallbackCtx = null;
  let fallbackGain = null;
  let fallbackStarted = false;
  let fallbackMuted = false;
  let fallbackVolume = 0.22;
  let heartbeat = null;

  const safeState = () => {
    try { return window.ArenaAudio?.getState?.() || { muted: false, volume: 0.4 }; }
    catch { return { muted: false, volume: 0.4 }; }
  };

  function ensureFallback() {
    if (fallbackCtx) return fallbackCtx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      fallbackCtx = new AC();
      fallbackGain = fallbackCtx.createGain();
      fallbackGain.gain.value = fallbackMuted ? 0.0001 : fallbackVolume;
      fallbackGain.connect(fallbackCtx.destination);
    } catch { fallbackCtx = null; }
    return fallbackCtx;
  }

  function pulse(freq, duration = 0.18, offset = 0) {
    const c = fallbackCtx;
    if (!c || c.state !== 'running' || fallbackMuted) return;
    const now = c.currentTime + offset;
    try {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.045, now + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain); gain.connect(fallbackGain);
      osc.start(now); osc.stop(now + duration + 0.03);
    } catch {}
  }

  function fallbackStart() {
    const c = ensureFallback();
    if (!c) return;
    if (c.state === 'suspended') c.resume().catch(() => {});
    if (fallbackStarted || c.state !== 'running') return;
    fallbackStarted = true;
    // A quiet, non-looping-per-note ambient bed. ArenaAudio remains the primary engine.
    const base = kind === 'burj' ? 98 : kind === 'connecta' ? 131 : 110;
    pulse(base, 0.7);
    pulse(base * 1.25, 0.9, 0.75);
    heartbeat = setInterval(() => {
      if (!fallbackCtx) return;
      if (fallbackCtx.state === 'suspended') { fallbackCtx.resume().catch(() => {}); return; }
      pulse(base, 0.65);
      pulse(base * 1.5, 0.55, 0.7);
    }, 3600);
  }

  async function unlock() {
    try { await window.ArenaAudio?.unlock?.(kind); } catch {}
    try {
      const state = safeState();
      fallbackMuted = !!state.muted;
      fallbackVolume = Math.max(0.08, Math.min(0.35, Number(state.volume) || 0.22));
      if (!fallbackMuted) fallbackStart();
    } catch {}
  }

  function sync() {
    try {
      const state = safeState();
      fallbackMuted = !!state.muted;
      fallbackVolume = Math.max(0.08, Math.min(0.35, Number(state.volume) || 0.22));
      if (fallbackGain) fallbackGain.gain.value = fallbackMuted ? 0.0001 : fallbackVolume;
      if (!fallbackMuted) unlock();
    } catch {}
  }

  // A real gesture is required by mobile autoplay policy. Do not rely on load-time audio.
  ['pointerdown', 'touchstart', 'mousedown', 'keydown', 'click'].forEach(type => {
    document.addEventListener(type, unlock, { capture: true, passive: true });
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) unlock();
  });
  window.addEventListener('pageshow', unlock);
  window.addEventListener('focus', unlock);

  // Keep both engines alive when Chrome/Safari/Firefox temporarily suspends AudioContext.
  setInterval(() => {
    try {
      const ctx = window.ArenaAudio?.ensure?.();
      if (ctx && ctx.state === 'suspended' && !safeState().muted) ctx.resume().catch(() => {});
      sync();
    } catch {}
  }, 2500);

  window.__MERVEIL_ARENA_AUDIO_GUARD__ = { unlock, sync, kind };
})();
