/**
 * Merveil video helpers — preload pool + client compression for World reels.
 * No server infra required; works in mobile Chrome / Safari / desktop.
 */

/** Max long edge after compress (TikTok-like vertical). */
export const MERVEIL_VIDEO_MAX_EDGE = 1280;
/** Target bitrate (bits/s) after compress. */
export const MERVEIL_VIDEO_BITRATE = 2_200_000;
/** Max duration seconds. */
export const MERVEIL_VIDEO_MAX_SEC = 60;
/** Compress if file larger than this (bytes). */
export const MERVEIL_VIDEO_COMPRESS_OVER = 12 * 1024 * 1024;

/**
 * Aggressive multi-slot preload so the next reel is already buffered.
 * Call touch(urls) whenever the active index changes.
 */
export function createVideoPreloadManager({ slots = 4 } = {}) {
  const cache = new Map(); // url -> HTMLVideoElement
  const order = [];

  function warm(url) {
    if (!url || typeof document === "undefined") return;
    if (cache.has(url)) {
      const el = cache.get(url);
      try {
        if (el.readyState < 2) el.load();
      } catch {}
      return el;
    }
    const el = document.createElement("video");
    el.preload = "auto";
    el.muted = true;
    el.playsInline = true;
    el.setAttribute("playsinline", "");
    el.setAttribute("webkit-playsinline", "");
    el.crossOrigin = "anonymous";
    el.src = url;
    try {
      el.load();
    } catch {}
    // Nudge network stack
    try {
      fetch(url, { mode: "no-cors", cache: "force-cache" }).catch(() => {});
    } catch {}
    cache.set(url, el);
    order.push(url);
    while (order.length > slots) {
      const old = order.shift();
      const doomed = cache.get(old);
      cache.delete(old);
      try {
        doomed.removeAttribute("src");
        doomed.load();
      } catch {}
    }
    return el;
  }

  function touch(urls = []) {
    const list = [...new Set((urls || []).filter(Boolean))];
    list.forEach(warm);
    return list.length;
  }

  function get(url) {
    return cache.get(url) || null;
  }

  function clear() {
    order.splice(0, order.length);
    cache.forEach((el) => {
      try {
        el.removeAttribute("src");
        el.load();
      } catch {}
    });
    cache.clear();
  }

  return { warm, touch, get, clear };
}

export const worldVideoPreloader =
  typeof window !== "undefined" ? createVideoPreloadManager({ slots: 5 }) : null;

function pickRecorderMime() {
  if (typeof MediaRecorder === "undefined") return null;
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  for (const m of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(m)) return m;
    } catch {}
  }
  return null;
}

/**
 * Compress / downscale a video File for faster World upload + playback.
 * Returns { file, width, height, duration, compressed }.
 */
export async function compressWorldVideo(file, {
  maxEdge = MERVEIL_VIDEO_MAX_EDGE,
  bitrate = MERVEIL_VIDEO_BITRATE,
  maxSec = MERVEIL_VIDEO_MAX_SEC,
  onProgress,
} = {}) {
  if (!file) throw new Error("No file");
  const mime = pickRecorderMime();
  if (!mime || typeof document === "undefined") {
    return { file, compressed: false, reason: "no_mediarecorder" };
  }

  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = url;

  try {
    await new Promise((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Could not read video"));
      setTimeout(() => reject(new Error("Video metadata timeout")), 20000);
    });

    const duration = Math.min(Number(video.duration) || maxSec, maxSec);
    let w = video.videoWidth || 720;
    let h = video.videoHeight || 1280;
    const long = Math.max(w, h);
    if (long > maxEdge) {
      const scale = maxEdge / long;
      w = Math.round(w * scale);
      h = Math.round(h * scale);
      // encoder prefers even dimensions
      w -= w % 2;
      h -= h % 2;
    }

    // Skip work if already small enough
    if (file.size <= MERVEIL_VIDEO_COMPRESS_OVER && long <= maxEdge + 40) {
      return { file, width: w, height: h, duration, compressed: false, reason: "already_small" };
    }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { alpha: false });
    const stream = canvas.captureStream(30);
    // Try to keep original audio if possible
    try {
      const any = video.captureStream?.() || video.mozCaptureStream?.();
      if (any) {
        any.getAudioTracks().forEach((t) => stream.addTrack(t));
      }
    } catch {}

    const chunks = [];
    const recorder = new MediaRecorder(stream, {
      mimeType: mime,
      videoBitsPerSecond: bitrate,
    });
    recorder.ondataavailable = (e) => {
      if (e.data?.size) chunks.push(e.data);
    };

    const stopped = new Promise((resolve) => {
      recorder.onstop = () => resolve();
    });

    video.currentTime = 0;
    await new Promise((r) => {
      video.onseeked = () => r();
      setTimeout(r, 400);
    });

    recorder.start(250);
    await video.play().catch(() => {});

    const started = performance.now();
    await new Promise((resolve) => {
      const tick = () => {
        if (video.paused || video.ended || video.currentTime >= duration) {
          try { video.pause(); } catch {}
          try { recorder.stop(); } catch {}
          resolve();
          return;
        }
        try {
          ctx.drawImage(video, 0, 0, w, h);
        } catch {}
        onProgress?.(Math.min(1, video.currentTime / duration));
        requestAnimationFrame(tick);
      };
      // safety timeout
      setTimeout(() => {
        try { video.pause(); } catch {}
        try { if (recorder.state !== "inactive") recorder.stop(); } catch {}
        resolve();
      }, Math.ceil(duration * 1000) + 8000);
      tick();
    });

    await stopped;
    stream.getTracks().forEach((t) => t.stop());

    const blob = new Blob(chunks, { type: mime.split(";")[0] });
    if (!blob.size) {
      return { file, width: w, height: h, duration, compressed: false, reason: "empty_output" };
    }
    const ext = mime.includes("mp4") ? "mp4" : "webm";
    const out = new File([blob], `merveil-reel-${Date.now()}.${ext}`, {
      type: blob.type || mime.split(";")[0],
    });
    // Only keep compressed if smaller or significantly downscaled
    if (out.size >= file.size * 0.95 && long <= maxEdge) {
      return { file, width: w, height: h, duration, compressed: false, reason: "not_smaller" };
    }
    return {
      file: out,
      width: w,
      height: h,
      duration,
      compressed: true,
      originalBytes: file.size,
      bytes: out.size,
      elapsedMs: Math.round(performance.now() - started),
    };
  } finally {
    try { URL.revokeObjectURL(url); } catch {}
  }
}
