/* Merveil AI service worker — push + force-fresh navigations + Arena audio guard. */
const CACHE_VER = "merveil-v2-2026-09-02-arena-audio";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_VER).map((k) => caches.delete(k)));
      await self.clients.claim();
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clients) client.postMessage({ type: "merveil:sw-updated", version: CACHE_VER });
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isNav = req.mode === "navigate" || req.destination === "document";
  const isHtml = url.pathname === "/" || url.pathname.endsWith(".html");
  if (!isNav && !isHtml) return;

  event.respondWith(
    (async () => {
      try {
        const response = await fetch(req, { cache: "no-store" });
        const isArena = /^\/arena\/(sahra|burj-rise|connecta)\.html$/i.test(url.pathname);
        if (!isArena || !response.ok) return response;

        // Inject after the page's inline ArenaAudio engine so the guard can use it.
        const type = response.headers.get("content-type") || "";
        if (!type.includes("text/html")) return response;
        const html = await response.text();
        if (html.includes("arena-audio-guard.js")) {
          return new Response(html, { status: response.status, statusText: response.statusText, headers: response.headers });
        }
        const patched = html.replace(
          /<\/body>/i,
          '<script src="/arena/arena-audio-guard.js" defer></script></body>'
        );
        const headers = new Headers(response.headers);
        headers.set("cache-control", "no-store, max-age=0");
        return new Response(patched, { status: response.status, statusText: response.statusText, headers });
      } catch {
        const cached = await caches.match(req);
        if (cached) return cached;
        throw new Error("offline");
      }
    })()
  );
});

self.addEventListener("push", (event) => {
  let payload = { title: "Merveil AI", body: "New activity", urgent: false, data: {} };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    try { payload.body = event.data ? event.data.text() : payload.body; } catch {}
  }
  const opts = {
    body: payload.body || "",
    tag: payload.tag || payload.data?.tag || "merveil",
    requireInteraction: !!payload.urgent,
    renotify: true,
    data: payload.data || {},
    vibrate: payload.urgent ? [200, 100, 200, 100, 200] : [120, 60, 120],
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
  };
  event.waitUntil(self.registration.showNotification(payload.title || "Merveil AI", opts));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const url = data.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.postMessage({ type: "merveil:notification-click", data });
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
