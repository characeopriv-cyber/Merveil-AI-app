# Merveil AI — Super App (V1)

Citizen-first social + marketplace + creator + passport platform for the Gulf / MENA region.

**Stack:** React (Vite) + Supabase + Vercel · Web Push / FCM · Arena games · World Reels · Pulse · Passport V2 · KYC + Wallet

---

## Current status (2026-09-01)

- **World:** Full-screen reels only (vertical), ranking (freshness / engagement / affinity / diversity), Super + comments, AI seed reels (36 across 12 categories), living watermark, continuous loop, cursor pagination.
- **Pulse:** Property reels ranked (own → fresh → video → recency), vertical swipe, Message → lister conversation.
- **Passport V2:** Tiers `core` / `professional` / `investor` / `company`. Activate requires **KYC verified + wallet charge**. Location-smart prices (AED/SAR/…). Capabilities tab (not price-first). LifeLink + Company Passport.
- **KYC + Wallet:** Real verification flow (DocCapture camera/upload), wallet top-up (sandbox), ledger, payout requests. Admin Verify + Payouts queue. Stripe path ready when `STRIPE_SECRET_KEY` is set.
- **Creator Studio:** Dashboard, wallet, campaigns, profile. Publish → own reel at index 0.
- **Messages / Calls:** Premium bubbles, day separators, CallRingtone, Accept acquires media in same gesture, busy-on-call 409, push notifications.
- **Arena:** Sahra / Burj Rise / Connecta — Web Audio BGM+SFX, pause/resume/restart, difficulty on Sahra, audio unlock on first gesture.
- **Admin:** `/merveil-admin-x9k2` — Overview, Citizens, Verify, World, Reports, Fraud, Property, Security, Audit, Admins, Sponsored, Payouts.
- **Marketplace / Invest:** LinkedIn-style cards, progressive load, Passport upgrade sheets, AI Assist on Invest.
- **Android TWA:** `android-twa/` package ready (targetSdk 36). Build AAB after keystore + assetlinks SHA-256.

Wallet/payments production Stripe is intentional next step; sandbox top-up works.

---

## Deploy order

### 1. Supabase SQL (run in order in SQL Editor)

Paste and run **entire** file each time:

1. `supabase-merveil-v1.sql` — core schema
2. `supabase-arena.sql`
3. `supabase-invest-push.sql`
4. `supabase-push-fcm.sql` (or `supabase-all-fixed.sql` if preferred combined)
5. `supabase-rls-push-fix.sql`
6. `supabase-world-engagement.sql`
7. `supabase-comments-target-fix.sql`
8. `supabase-passport-v2.sql`
9. `supabase-creator-studio-v1.sql`
10. `supabase-kyc-wallet-v1.sql`
11. `supabase-admin.sql`
12. `supabase-sound.sql` (if using Arena audio tables)
13. `supabase-phase-session-passport.sql` (if still needed for session helpers)

Re-run only the files you change. Prefer incremental over wiping.

### 2. Environment variables (Vercel / host)
