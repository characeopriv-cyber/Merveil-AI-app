# Merveil API — Authorization Matrix (Meta-style)

**Rule:** Identity comes only from session (`Actor.id` / `jwtSub`). Never trust `body.userId`, `body.ownerId`, or client profile id for writes.

**Actor types:** `visitor` (no session) · `citizen` (session) · `admin` (admin cookie + RBAC) · `michael` (elevated dual-auth)

**Codes:** `AUTH_REQUIRED` · `NOT_PARTICIPANT` · `OWNER_ONLY` · `VISITOR_WRITE_DENIED`

---

## Central helpers (shipped)

| Helper | Behavior |
|--------|----------|
| `buildActor({ user, jwtSub, token })` | Built once per request in `router.js` |
| `requireCitizenActor(actor, res)` | 401 if no id |
| `requireParticipantActor(actor, ids, res)` | 403 if not in participant_ids |
| `sameActorId(a, b)` | String-safe ownership compare |
| `actorOnlyId(actor, claimed)` | Rejects body spoof ≠ actor |

Also: `lib/merveilAuthz.js` (shared module for future route splits).

---

## High-risk routes — hardened in this pass

| Resource | Method / action | Visitor | Citizen | Scope rule |
|----------|-----------------|---------|---------|------------|
| `/api/conversations/:id/messages` | GET | 401 | OK | Participant only |
| `/api/conversations/:id/messages` | POST | 401 | OK | Participant; `sender_id` = Actor only |
| `/api/properties` | POST | 401 | OK | `owner_id` = Actor only |
| `/api/world` | POST (create) | 401 | OK | `owner_id` = Actor only |
| `/api/world` | POST update | 401 | OK | Owner only (`sameActorId`) |
| `/api/world` | POST delete-mine | 401 | OK | Deletes only `owner_id = Actor` |
| `/api/wallet` | * | 401 | OK | All ledger ops scoped to Actor.id |
| `/api/passport` | * | 401 | OK | Activate / status only self |
| `/api/kyc` | * | 401 | OK | Docs + status only self |

---

## Full surface (expected policy)

Legend: **P** public · **C** citizen · **Part** participant · **Own** owner · **Adm** admin · **Wh** webhook signature · **M** Michael

| Resource | Read | Write | Notes |
|----------|------|-------|-------|
| share | P | — | OG HTML only |
| auth/session | P/C | — | Restores from cookie / jwtSub |
| auth/login · register | P | rate-limited | |
| auth/realtime-token | C | — | Sets Realtime JWT |
| properties GET | P | — | |
| properties POST/PATCH/DELETE | — | C + Own | owner_id from Actor |
| properties view/like/super | P/C | C | rate-limited views |
| services | P | C + Own | |
| conversations list | C | C | participants only |
| conversations/:id/messages | C + Part | C + Part | E2EE fail-closed |
| conversations presence | C | C | |
| circles | C | C | |
| events | P/C | C | |
| notifications counts | C | — | |
| push subscribe | C | C | jwtSub |
| invest | P | C + Own | |
| reports | C | C | → admin_cases |
| citizen-settings | C | C | self only |
| michael * | Adm | Adm + dual | kill switch / elevate |
| admin-auth · console | Adm | Adm | secret slug UI |
| world GET | P | — | |
| world like/super/save/repost | — | C | counters server-side |
| world create/update/delete | — | C + Own | Actor owner_id |
| creator-studio | C | C | self studio |
| rewards daily-claim | C | C | |
| sound | P | C | |
| arena | C | C | credits postMessage trusted carefully |
| developer-keys | C/Adm | C/Adm | launch lane |
| e2ee | C | C | device keys self |
| connections | C | C | |
| calls * | C | C + Part | accept in same gesture client-side |
| webrtc ice-servers | C | — | |
| comments | P/C | C | target ownership where needed |
| people / profile-views | P/C | C | |
| lifelink · company | C | C | passport gates |
| webhooks stripe/flw | — | Wh | HMAC + idempotency |
| kyc | C | C | self; admin review via console |
| wallet | C | C | never credit from client success |
| payments | C | C | product_id server catalog |
| passport activate | C | C + KYC | server AED prices |
| ai-call | C | C | usage limits |
| assistant | C | C | AI rate limits |

---

## Migration status (2026-09-21 — citizen core complete)

| Target | Status |
|--------|--------|
| `/api/calls` create + accept/reject/end | Done — Actor |
| `/api/connections` all | Done — Actor |
| `/api/comments` POST/DELETE | Done — Actor |
| `/api/world` create/update/delete-mine/react | Done — Actor |
| `/api/services` POST + like | Done — Actor |
| Message PATCH edit / read / delete / convo delete | Done — Actor |
| Invest create / like / delete | Done — Actor |
| properties POST / like / SUPER | Done — Actor |
| wallet / passport / kyc | Done — Actor |

Optional later: circles, events RSVP, push admin send — use Actor when touched.

Pattern for any new route:

```js
if (!requireCitizenActor(actor, res)) return;
const id = actor.id;
// insert owner_id / sender_id: id  — never body.userId
```

---

## Test cases (manual / CI later)

| Case | Expect |
|------|--------|
| Visitor POST message | 401 AUTH_REQUIRED |
| Citizen A reads B-only convo | 403 NOT_PARTICIPANT |
| Citizen A posts property with body.owner_id = B | property owned by A |
| Citizen A wallet topup with body.userId = B | credits A only |
| Citizen A passport activate | only A’s tier changes |
| No session world post | 401 |
| Webhook without valid Stripe signature | 400/401, no ledger credit |

---

## Deploy checklist

1. Copy updated `router.js` to API entry.  
2. Copy `lib/merveilAuthz.js` next to `supabaseServer.js` (optional until route split).  
3. Smoke: sign-in → send message → post World → wallet status → passport status.  
4. Negative: open second account, attempt message on foreign conversation id → 403.

---

*Generated 2026-09-21 — Merveil security pass A (Actor + high-risk routes).*
