# Push notifications — status check

## Stack
- **Web Push** — VAPID keys + `push_subscriptions` table + `sw.js` push handler
- **FCM** — optional via `FIREBASE_SERVICE_ACCOUNT_JSON` + device tokens
- Server: `pushSend.js` → `notifyUser()` from router

## Required env (Vercel)
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` (mailto:…)
- Optional: `FIREBASE_SERVICE_ACCOUNT_JSON`, `FCM_PROJECT_ID`

## Citizen flow
1. Settings → enable notifications (or first message/call prompt)
2. `GET /api/push?action=vapid-public`
3. `pushManager.subscribe` + `POST /api/push?action=subscribe` (Actor / jwtSub)
4. Background: SW `push` event → system notification
5. Click → `merveil:notification-click` → open chat / answer call

## What sends push today
- New message (non-E2EE preview or "secure message")
- Connection request / accept
- Missed call
- Admin security (elevated)

## Verify
```
GET /api/push?action=status   → vapid/fcm flags + deviceCount
```
Permission must be **granted**; HTTPS only.

## Offline note
Push still requires network delivery from FCM/Web Push servers.
IndexedDB caches **read** history when offline; outbox queues **sends**.
