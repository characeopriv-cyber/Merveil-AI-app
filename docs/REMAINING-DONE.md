# Remaining work completed — 2026-09-21

## 1. Server-side ranking
- `lib/merveilRanking.js` — `rankWorldReels`, `rankPulseListings`, `parseAffinity`
- `GET /api/world` ranks by default (`ranked=1`); response includes `ranked: true`
- `GET /api/properties` ranks by default for Pulse Discover
- App World feed requests `ranked=1` on load + load-more

## 2. Authz (full citizen core)
See `AUTHZ-MATRIX.md` + prior ship notes. Actor on messages, calls, connections, world, pulse, invest, services, comments, wallet, passport, kyc.

## 3. App split foundation
- Shared ranking modules under `lib/` and `src/lib/`
- `APP-SPLIT-PLAN.md` — ordered domain extract from `App.jsx`
- Interface + Developer **not** changed

## 4. Files to copy (no zip)

| File |
|------|
| `router.js` |
| `App.jsx` |
| `lib/merveilRanking.js` |
| `lib/merveilAuthz.js` |
| `src/lib/merveilRanking.js` |
| `AUTHZ-MATRIX.md` |
| `CITIZEN-SHIP-NOTES.md` |
| `APP-SPLIT-PLAN.md` |
| `REMAINING-DONE.md` |

## 5. Still later (not blocking citizen ship)
- Physical cut of MessagesView / WorldView into separate JSX files (plan ready)
- Circles / events Actor polish
- Automated authz CI
- Server affinity storage (currently client localStorage + optional query)

## Smoke
World feed loads ordered intelligently · listings Pulse order · send message · call · wallet status.
