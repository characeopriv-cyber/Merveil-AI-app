# Offline IndexedDB (merveil_offline_v1)

## Stores
| Store | Purpose |
|-------|---------|
| threads | Conversation list cache |
| messages | Per-thread messages (`conversationId:messageId`) |
| directory | Citizens snapshot |
| outbox | Queued sends (IDB; localStorage outbox still used too) |
| meta | Key/value (e.g. last sync) |

## App behavior
- Online load → `MerveilOfflineIdb.cacheThreads`
- Offline open Connect → hydrate threads from IDB if list empty
- Service worker: network-first HTML; precache `/` shell (CACHE_VER bumped)

## Deploy
1. `lib/merveilOfflineIdb.js` (or `src/lib/`) next to app bundle root so dynamic import resolves
2. `sw.js` at site root
3. `App.jsx` + `router.js`

## Limits
- Not a full offline WhatsApp clone yet — no media blob cache
- E2EE ciphertext can cache; decrypt needs local keys
