# jwtSub — why Merveil uses it (Meta-style session)

## Problem

Browser sessions use **HttpOnly cookies** (`jx_at` access + `jx_rt` refresh).  
Access tokens expire (~1h). Refresh rotates them. Concurrent tabs and mobile backgrounding cause **races**:

- Cookie still valid  
- `getUser()` / live `user` object briefly **null**  
- UI still shows you from `localStorage` (`junction_user`)

If APIs only check `if (!user)`, citizens see **“Sign in required”** while the app looks logged in (daily claim, messages, calls).

## What jwtSub is

`jwtSub` = the **`sub` claim** inside the JWT (your stable user UUID), decoded from the access **or** refresh cookie **without** requiring a successful `getUser()` round-trip.

```
getSession() → { token, user, jwtSub }
actor = buildActor({ user, jwtSub, token })
actor.id = user.id || jwtSub
```

## Rules

| Source | Trust for identity? |
|--------|---------------------|
| `actor.id` / `jwtSub` | **Yes** — server authorization |
| `localStorage.junction_user` | **No** — UI cache only |
| `body.userId` / `body.ownerId` | **Never** — IDOR risk |

## Actor

```js
requireCitizenActor(actor, res)  // 401 if no actor.id
// all writes: owner_id / sender_id = actor.id
```

## What you should feel

- Claim daily, send message, call, post — **without** sign-out/in after idle  
- Only true cookie absence → real sign-in wall  
