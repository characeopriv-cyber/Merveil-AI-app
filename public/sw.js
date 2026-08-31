/* Merveil AI service worker — push + force-fresh navigations (Firefox/Chrome/Safari).
 * Deploy at site root: /sw.js
 * Bump CACHE_VER when shipping UI fixes so browsers drop stale shells.
 */
const CACHE_VER = "merveil-v1-2026-08-30-push";

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
      for (const client of clients) {
        client.postMessage({ type: "merveil:sw-updated", version: CACHE_VER });
      }
    })()
  );
});

// HTML / navigations: network-first so Firefox does not keep an old index shell.
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
        return await fetch(req, { cache: "no-store" });
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
    try {
      payload.body = event.data ? event.data.text() : payload.body;
    } catch {}
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
