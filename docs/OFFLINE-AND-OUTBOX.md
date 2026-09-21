# Offline & outbox (Connect)

## Today

- `navigator.onLine` checked on send  
- Failed / offline sends → **outbox** in `localStorage` (`junction_outbox` / `merveil_outbox`)  
- On reconnect + mount → flush outbox (retry cap 8)  
- Optimistic bubbles stay on screen  

## Gaps (honest)

- No full offline **read** of message history (needs IndexedDB cache)  
- World / Pulse feeds need network  
- E2EE messages need keys on device (already local)

## Recommended next

1. Cache last N threads + messages in IndexedDB  
2. Service worker already present (`sw.js`) — add message queue sync event  
3. Banner: “You’re offline — X messages queued” (partially exists)

## Citizen tip

Airplane mode → type → send → bubble stays → land → messages flush when online.
