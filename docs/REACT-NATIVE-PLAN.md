# React Native path for Merveil (practical)

Do **not** port the 34k-line web `App.jsx` in one shot. Ship RN as a **thin client** on the same APIs.

## Phase 0 — already shared
- `api/router.js` + Supabase (auth, conversations, groups, presence, calls)
- HttpOnly session / jwtSub patterns
- Area Groups + Connect ranking endpoints

## Phase 1 — Expo app shell (2–3 weeks)
```
merveil-mobile/
  app/               # Expo Router
  src/api/merveilFetch.ts
  src/screens/Connect, Groups, Messages, Pulse, Passport
  src/components/Avatar, PresenceDot, Composer
```
- Auth: same `/api/auth/session` + secure cookie / token storage (`expo-secure-store`)
- Connect list + Messages poll + Groups catalog/post (reuse web contracts)
- Emoji: `react-native-emoji-selector` or built-in keyboard

## Phase 2 — parity
- Realtime: Supabase JS in RN with `ensureRealtimeAuth` equivalent
- Calls: `react-native-webrtc` + existing `/api/calls`
- Push: FCM / APNs via existing `push_subscriptions`

## Phase 3 — polish
- Offline outbox (AsyncStorage / SQLite mirror of IndexedDB outbox)
- Shared design tokens (greige / brand teal)

## Rule
Web stays production PWA. RN consumes **the same** `/api/*` — no second backend.
