/* Merveil AI service worker — background notifications (calls, messages, activity).
 * Deploy at site root: /sw.js
 * Full closed-app delivery also needs VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY on the server.
 */
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
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
    tag: payload.tag || "merveil",
    requireInteraction: !!payload.urgent,
    renotify: !!payload.urgent,
    data: payload.data || {},
    vibrate: payload.urgent ? [200, 100, 200] : [100],
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
