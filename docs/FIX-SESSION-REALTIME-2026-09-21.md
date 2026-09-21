# Fix: Sign-in false positives + Connect realtime (2026-09-21)

## Root cause

UI shows `currentUser` from **localStorage cache**, but many APIs still required full `user` from access-token `getUser()`. During refresh races, `user` is null while **`jwtSub` / Actor still know who you are** → `"Sign in required."` on daily claim, failed message POSTs, stale directory.

## Fixes shipped

### Server (`router.js`)
1. **Daily claim** → `requireCitizenActor(actor)` + `claimUserId = actor.id` (no more `if (!user)`).
2. **Inbox list** → order by `last_message_at` (fallback `created_at`) + in-memory sort.
3. **Directory rank** → contact first, then **new citizens (5 days)**, then online, then name — so new users appear without sign-out/in.
4. **Opportunities** → Actor.
5. Prior Actor pass on messages / calls / connections / world / wallet still required.

### Client (`App.jsx`)
1. **Claim daily** → session soft-restore + one 401 retry; toast instead of only `alert`.
2. **sendMessage** → on 401/AUTH_REQUIRED: restore session, **retry once**; **never delete** optimistic bubble (queue outbox instead of vanish).
3. Refresh conversations after successful send.

## Deploy (copy separately)
- `router.js`
- `App.jsx`
- (optional) prior `lib/merveilAuthz.js`, `lib/merveilRanking.js`

## Smoke
1. Stay signed in → Passport → Claim daily → should credit without alert.
2. Send message → bubble stays → thread jumps to top within ~2s.
3. Connect citizens → new accounts within 5 days rank above pure offline strangers.
4. Missed call → system line in conversation after accept/reject/end path (existing `writeCallSystemMessage`).

## If still “Sign in required”
- Hard refresh once after deploy.
- Confirm cookies on **both** `junction.technology` and `www` (Domain=`.junction.technology`).
- Vercel must serve the new `router.js`.
