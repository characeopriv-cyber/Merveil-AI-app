/* Merveil Arena audio reliability guard.
 * Provides a resilient Web Audio fallback for Arena games. It unlocks only from
 * real user interaction, respects the game's mute/volume state, resumes after
 * visibility changes, and keeps a quiet musical bed alive on mobile browsers.
 */
(() => {
  const path = location.pathname.toLowerCase();
  const kind = path.includes('burj-rise') ? 'burj' : path.includes('connecta') ? 'connecta' : 'sahra';
  let fallbackCtx = null;
  let fallbackGain = null;
  let fallbackStarted = false;
  let fallbackMuted = false;
  let fallbackVolume = 0.42;
  let heartbeat = null;

  const safeState = () => {
    try {
      return window.ArenaAudio?.getState?.() || { muted: false, volume: 0.45 };
    } catch {
      return { muted: false, volume: 0.45 };
    }
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
    } catch {
      fallbackCtx = null;
    }
    return fallbackCtx;
  }

  function tone(freq, duration = 0.18, offset = 0, peak = 0.075, type = 'sine') {
    const c = fallbackCtx;
    if (!c || c.state !== 'running' || fallbackMuted) return;
    const now = c.currentTime + offset;
    try {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.001, peak), now + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(fallbackGain);
      osc.start(now);
      osc.stop(now + duration + 0.04);
    } catch {}
  }

  function playPhrase() {
    const base = kind === 'burj' ? 98 : kind === 'connecta' ? 131 : 110;
    const melody = kind === 'burj'
      ? [0, 4, 7, 11, 7, 4]
      : kind === 'connecta'
        ? [0, 4, 7, 12, 7, 4]
        : [0, 3, 7, 10, 7, 3];

    melody.forEach((step, i) => {
      const f = base * Math.pow(2, step / 12);
      tone(f, 0.48, i * 0.46, 0.055, i % 3 === 0 ? 'triangle' : 'sine');
    });

    // Low pulse gives the music presence on phone speakers without being loud.
    tone(base * 0.5, 0.22, 0.0, 0.085, 'sine');
    tone(base * 0.5, 0.18, 1.38, 0.065, 'sine');
    tone(base * 0.5, 0.18, 2.76, 0.065, 'sine');
  }

  function fallbackStart() {
    const c = ensureFallback();
    if (!c) return;
    if (c.state === 'suspended') c.resume().catch(() => {});
    if (fallbackStarted || c.state !== 'running') return;
    fallbackStarted = true;
    playPhrase();
    heartbeat = setInterval(() => {
      if (!fallbackCtx) return;
      if (fallbackCtx.state === 'suspended') {
        fallbackCtx.resume().catch(() => {});
        return;
      }
      if (!fallbackMuted) playPhrase();
    }, 3200);
  }

  async function unlock() {
    try {
      const state = safeState();
      fallbackMuted = !!state.muted;
      const requested = Number(state.volume);
      fallbackVolume = Math.max(0.12, Math.min(0.55, Number.isFinite(requested) ? requested * 0.72 : 0.32));
    } catch {}

    const c = ensureFallback();
    if (!c || fallbackMuted) return;
    try { await c.resume(); } catch {}
    if (c.state === 'suspended') {
      try { await c.resume(); } catch {}
    }
    if (c.state === 'running') fallbackStart();
  }

  function sync() {
    try {
      const state = safeState();
      fallbackMuted = !!state.muted;
      const requested = Number(state.volume);
      fallbackVolume = Math.max(0.12, Math.min(0.55, Number.isFinite(requested) ? requested * 0.72 : 0.32));
      if (fallbackGain) fallbackGain.gain.value = fallbackMuted ? 0.0001 : fallbackVolume;
      if (!fallbackMuted) unlock();
    } catch {}
  }

  ['pointerdown', 'touchstart', 'mousedown', 'keydown', 'click'].forEach(type => {
    document.addEventListener(type, unlock, { capture: true, passive: true });
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) unlock();
  });
  window.addEventListener('pageshow', unlock);
  window.addEventListener('focus', unlock);

  setInterval(() => {
    try {
      const ctx = window.ArenaAudio?.ensure?.();
      if (ctx && ctx.state === 'suspended' && !safeState().muted) ctx.resume().catch(() => {});
      if (fallbackCtx && fallbackCtx.state === 'suspended' && !fallbackMuted) fallbackCtx.resume().catch(() => {});
      sync();
    } catch {}
  }, 2500);

  window.__MERVEIL_ARENA_AUDIO_GUARD__ = { unlock, sync, kind };
})();
