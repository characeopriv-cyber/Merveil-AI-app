/* Merveil AI service worker — push + force-fresh navigations (Firefox/Chrome/Safari).
 * Deploy at site root: /sw.js
 * Bump CACHE_VER when shipping UI fixes so browsers drop stale shells.
 */
const CACHE_VER = "merveil-v1-2026-09-04-desktop-responsive";

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
  const data = payload.data || {};
  const isCall = !!(data.callId || /call/i.test(String(data.type || "")) || /call/i.test(String(payload.tag || "")));
  const urgent = !!(payload.urgent || isCall);
  const opts = {
    body: payload.body || "",
    tag: payload.tag || data.tag || (isCall ? `call-${data.callId || "ring"}` : "merveil"),
    requireInteraction: urgent,
    renotify: true,
    silent: false,
    data: { ...data, url: data.url || (isCall ? "/?tab=messages" : "/") },
    // Long pattern so a missed glance still feels like a phone ring
    vibrate: urgent
      ? [400, 160, 400, 160, 400, 160, 400, 400, 400, 160, 400, 160, 400]
      : [120, 60, 120],
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
  };
  if (isCall) {
    opts.actions = [
      { action: "answer", title: "Answer" },
      { action: "decline", title: "Decline" },
    ];
  }
  event.waitUntil(self.registration.showNotification(payload.title || (isCall ? "Incoming call" : "Merveil AI"), opts));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const action = event.action || "";
  const url = data.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const payload = { ...data, notificationAction: action };
      for (const client of clientList) {
        if ("focus" in client) {
          client.postMessage({ type: "merveil:notification-click", data: payload });
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
