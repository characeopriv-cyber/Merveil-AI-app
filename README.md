# Merveil AI — Intelligence Layer Beyond Interaction

Merveil AI by IVONIX is a citizen-first intelligence platform combining trusted identity, connection, AI, voice, world content, property, commerce and developer infrastructure.

The product is deliberately bigger than a social app: **Merveil App is the flagship experience; Merveil APIs and infrastructure let companies build on the same intelligence layer.**

## Platform pillars

- **Identity** — Merveil Passport, progressive verification and company identity.
- **Connection** — intelligent Connect, messaging, introductions and real-time presence.
- **Intelligence** — Merveil AI Assist and API-based AI capabilities.
- **Voice** — Merveil AI Call, separate from AI Assist, with language/voice configuration.
- **World** — World Reels for global discovery and creator publishing.
- **Pulse** — Pulse Reels dedicated to real estate.
- **Trust** — verification, authorization, security controls, auditability and webhooks.
- **Developer Platform** — API keys, OAuth, scopes, quotas, usage, webhooks, billing and onboarding.
- **Marketplace** — property, investor, Souk and Work experiences.
- **Arena** — Sahra, Burj Rise and Connecta with credits and hardened mobile audio lifecycle handling.

## Developer Platform

Production API base path: `/api/v1`

Authentication supports `X-API-Key` and OAuth Bearer tokens. API credentials use `mv_test_*` and `mv_live_*` environments. The catalog covers profile, passport, verification, connection, messages, AI, call, companies, properties, World, investors, credits, webhooks, OAuth, usage and commercial billing/onboarding.

Core developer capabilities include:

- scoped API access
- request IDs
- rate-limit and quota headers
- monthly usage metering
- webhook signing and delivery history
- replay/test delivery
- OAuth configuration
- API Playground and documentation surfaces
- commercial plans: Sandbox, Developer ($9), Growth ($49), Business ($199)
- client onboarding and invoice infrastructure

**Payment note:** the commercial billing architecture is provider-ready, but live money capture is not claimed as production-certified until the payment provider and end-to-end payment flow are verified.

## Production status — September 2, 2026

- Production deployment: **READY**
- API/security/database QA: **PASS after ownership-policy hardening**
- `/api/v1/health`: operational
- API catalog: deployed
- RLS: enabled on inspected public tables
- Privileged SECURITY DEFINER RPC exposure: restricted from `anon`/`authenticated`
- Production 5xx scan: clean in the latest QA window
- Arena audio lifecycle hardening: deployed
- Deep QA report: `docs/deep-qa-2026-09-02.md`
- Production verification record: `API_PRODUCTION_STATUS.md`

### Remaining certification items

These are intentionally not represented as completed until physically verified:

1. Real-device sign-in/session testing.
2. Camera/document capture and permissions.
3. Two-device WebRTC call verification.
4. AI Call language/voice/native-speech verification.
5. Arena audio after background/foreground on Android and iOS.
6. Push notification and realtime Connect verification.
7. Reel camera/upload and marketplace media verification.
8. OAuth consent-flow verification.
9. Live payment capture verification.
10. Cleanup of the Node `DEP0169` deprecation warning.

## Architecture

`Merveil App → Merveil APIs → Developer → Organization → Plan → Subscription → Usage → Billing Events → Invoice → Payment Provider → Revenue Tracking → Client Onboarding`

Underlying platform services connect identity, trust, connection, AI, voice, content, property and commerce while keeping authorization and usage controls at the API boundary.

## Repository

GitHub: `characeopriv-cyber/Merveil-AI-app`

Deployment platform: Vercel

Database/auth/realtime: Supabase

## Investor positioning

> **Other platforms give you APIs. Merveil gives you an intelligence layer.**

Merveil is designed to prove the infrastructure through its own consumer experience first, then expose that infrastructure to companies through developer APIs and commercial plans.

See `docs/INVESTOR_CLIENT_READINESS.md` for the current investor/client package and `docs/DEMO_SCRIPT.md` for the recommended live demonstration sequence.
