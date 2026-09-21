# Merveil — GitHub upload map (2026-09-21 full pass)

Put each file at the path below in your repo (e.g. `Merveil-AI-app` / Junction).

## Must deploy (runtime)

| Local file | GitHub path |
|------------|-------------|
| `App.jsx` | `src/App.jsx` **or** root `App.jsx` (match your Vite entry) |
| `router.js` | `api/router.js` (Vercel API entry) |
| `sw.js` | **public root** `sw.js` or `public/sw.js` |
| `pushSend.js` | `api/pushSend.js` **and/or** `lib/pushSend.js` (router imports both) |

## Modules (new / updated this pass)

| Local file | GitHub path |
|------------|-------------|
| `lib/merveilAuthz.js` | `lib/merveilAuthz.js` |
| `lib/merveilRanking.js` | `lib/merveilRanking.js` |
| `lib/merveilOfflineIdb.js` | `lib/merveilOfflineIdb.js` |
| `src/lib/merveilRanking.js` | `src/lib/merveilRanking.js` |
| `src/lib/merveilOfflineIdb.js` | `src/lib/merveilOfflineIdb.js` |
| `src/merveil/MessagesView.jsx` | `src/merveil/MessagesView.jsx` |
| `src/merveil/WorldView.jsx` | `src/merveil/WorldView.jsx` |

Keep existing if already in repo:
- `lib/merveilE2ee.js`, `lib/merveilCallE2ee.js`, `lib/supabaseServer.js`

## Docs (optional but useful)

| Local file | GitHub path |
|------------|-------------|
| `JWT-SUB-EXPLAINED.md` | `docs/JWT-SUB-EXPLAINED.md` |
| `OFFLINE-AND-OUTBOX.md` | `docs/OFFLINE-AND-OUTBOX.md` |
| `OFFLINE-IDB.md` | `docs/OFFLINE-IDB.md` |
| `PUSH-STATUS.md` | `docs/PUSH-STATUS.md` |
| `AUTHZ-CI-TABLE.md` | `docs/AUTHZ-CI-TABLE.md` |
| `AUTHZ-MATRIX.md` | `docs/AUTHZ-MATRIX.md` |
| `MERVEIL-AI-ACTIONS-RECOMMENDATIONS.md` | `docs/MERVEIL-AI-ACTIONS-RECOMMENDATIONS.md` |
| `FIX-SESSION-REALTIME-2026-09-21.md` | `docs/FIX-SESSION-REALTIME-2026-09-21.md` |
| `APP-SPLIT-PLAN.md` | `docs/APP-SPLIT-PLAN.md` |
| `CITIZEN-SHIP-NOTES.md` | `docs/CITIZEN-SHIP-NOTES.md` |
| `SHIP-FILES-2026-09-21-PM.md` | `docs/SHIP-FILES-2026-09-21-PM.md` |
| `GITHUB-UPLOAD-MAP.md` | `docs/GITHUB-UPLOAD-MAP.md` (this file) |
| `REMAINING-DONE.md` | `docs/REMAINING-DONE.md` |
| `SECURITY-ZERO-TRUST.md` | `docs/SECURITY-ZERO-TRUST.md` |

## Minimum viable production set

If you only upload **6 files**, use:

1. `api/router.js` ← router.js  
2. `src/App.jsx` (or your App path) ← App.jsx  
3. `sw.js` (site root)  
4. `lib/merveilRanking.js`  
5. `lib/merveilAuthz.js`  
6. `lib/merveilOfflineIdb.js`  

Plus `pushSend.js` next to the API if not already there.

## Env (Vercel) — not files

- `SUPABASE_SERVICE_ROLE_KEY`
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT`
- `STRIPE_*` if payments live
- Optional: `ANTHROPIC_API_KEY`, `FIREBASE_SERVICE_ACCOUNT_JSON`

## Note on split views

`src/merveil/MessagesView.jsx` + `WorldView.jsx` are **extracted copies**.  
Live UI still runs from **App.jsx** until you switch imports. Upload them for the split plan; App.jsx alone is enough for runtime.
