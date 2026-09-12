/* Merveil AI service worker — push + force-fresh navigations + Arena audio guard. */
const CACHE_VER = "merveil-v4-2026-09-12-developer-bypass";

self.addEventListener("install", (event) => { self.skipWaiting(); });

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE_VER).map((k) => caches.delete(k)));
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of clients) client.postMessage({ type: "merveil:sw-updated", version: CACHE_VER });
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Developer is a separate application surface. Never let the Citizen
  // service worker intercept it or return the Citizen document first.
  if (/^\/developer(?:\/|$)/.test(url.pathname) || /^\/developer-portal(?:\/|$)/.test(url.pathname) || /^\/api\//.test(url.pathname)) return;

  const isNav = req.mode === "navigate" || req.destination === "document";
  const isHtml = url.pathname === "/" || url.pathname.endsWith(".html");
  if (!isNav && !isHtml) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(req, { cache: "no-store" });
      const isArena = /^\/arena\/(sahra|burj-rise|connecta)\.html$/i.test(url.pathname);
      if (!isArena || !response.ok) return response;
      const type = response.headers.get("content-type") || "";
      if (!type.includes("text/html")) return response;
      const html = await response.text();
      if (html.includes("arena-audio-guard.js")) return new Response(html, { status: response.status, statusText: response.statusText, headers: response.headers });
      const patched = html.replace(/<\/body>/i, '<script src="/arena/arena-audio-guard.js" defer></script></body>');
      const headers = new Headers(response.headers);
      headers.set("cache-control", "no-store, max-age=0");
      return new Response(patched, { status: response.status, statusText: response.statusText, headers });
    } catch {
      const cached = await caches.match(req);
      if (cached) return cached;
      throw new Error("offline");
    }
  })());
});

self.addEventListener("push", (event) => {
  let payload = { title: "Merveil AI", body: "New activity", urgent: false, data: {} };
  try { if (event.data) payload = { ...payload, ...event.data.json() }; }
  catch { try { payload.body = event.data ? event.data.text() : payload.body; } catch {} }
  const data = payload.data || {};
  event.waitUntil(self.registration.showNotification(payload.title || "Merveil AI", {
    body: payload.body || "", tag: payload.tag || data.tag || `merveil:${data.notification_id || "activity"}`,
    requireInteraction: !!payload.urgent, renotify: true, data,
    vibrate: payload.urgent ? [200,100,200,100,200] : [120,60,120], icon: "/merveil-mark.svg", badge: "/merveil-mark.svg",
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const absolute = new URL(data.url || data.action_url || "/", self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clientList) => {
    for (const client of clientList) {
      if (client.url.startsWith(self.location.origin) && "focus" in client) {
        try { if ("navigate" in client && client.url !== absolute) await client.navigate(absolute); } catch {}
        client.postMessage({ type: "merveil:notification-click", data });
        return client.focus();
      }
    }
    if (self.clients.openWindow) return self.clients.openWindow(absolute);
  }));
});