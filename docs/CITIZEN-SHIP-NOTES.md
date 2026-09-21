# Merveil Citizen app — ship notes (2026-09-21)

**Scope this pass:** citizen product only (Pulse · Connect · World · Passport · Wallet · Calls).  
**Out of scope:** Interface room, Developer portal (leave as-is).

---

## Files to deploy (copy separately — no zip)

| File | Where |
|------|--------|
| `router.js` | API entry (replace existing) |
| `lib/merveilAuthz.js` | Next to `supabaseServer.js` / `lib/` (optional but recommended) |
| `AUTHZ-MATRIX.md` | Repo docs |
| `CITIZEN-SHIP-NOTES.md` | This file |

`App.jsx` was **not** rewritten this pass — client session/`merveilFetch` already uses credentials + session restore. Backend Actor is the security fix.

---

## Authz completed on citizen-critical routes

| Area | Routes hardened |
|------|-----------------|
| Messages | GET/POST messages, edit, mark read, delete message, delete conversation |
| Connect | `/api/connections` (all actions use `actor.id`) |
| Calls | create, accept / reject / end |
| World | create, update, delete-mine, react |
| Pulse listings | properties POST, like, SUPER |
| Services | publish, like |
| Invest | create, like, delete |
| Comments | POST, DELETE |
| Money / identity | wallet, passport, kyc |

**Identity rule:** `owner_id` / `sender_id` / `user_id` always from **Actor** (session + jwtSub). Body spoofing ignored.

---

## Smoke test (citizen)

1. Sign in (Google or email).  
2. Connect → open directory → Message someone → send text → edit → mark read.  
3. Connection request → accept on second account.  
4. Voice call create → accept on other device (same gesture for mic).  
5. World → post reel (video) → Super → comment → delete own.  
6. Pulse → post listing → like / SUPER.  
7. Invest → post → like → delete own.  
8. Passport → status → (if KYC verified) activate paid tier path.  
9. Wallet → status / top-up sandbox.  
10. Kill network mid-message → outbox queue → reconnect → flush.

Negative:

- Account A cannot read Account B’s conversation → **403 NOT_PARTICIPANT**.  
- Account A cannot delete B’s World post / listing.  
- Visitor cannot POST message / world / wallet.

---

## Known intentional deferrals

- Interface + Developer portals — not touched.  
- Full App.jsx module split (Connect extract) — deferred; do after this ship is stable.  
- Server-side World/Pulse ranking — next quality pass.  
- Automated authz CI table — use AUTHZ-MATRIX.md as checklist until tests exist.

---

## Ops

- Env still required: `SUPABASE_SERVICE_ROLE_KEY`, Stripe keys if live payments, VAPID for push.  
- SQL: existing master + realtime + zero-trust packs already in repo; no new SQL required for this authz pass.
