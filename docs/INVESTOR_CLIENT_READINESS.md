# Merveil AI — Investor & Client Readiness Package

**Date:** September 2, 2026

## 1. Executive positioning

Merveil AI is not being positioned as another social application.

**Merveil is an intelligence layer beyond interaction.**

The flagship Merveil experience demonstrates the infrastructure through trusted identity, connection, AI, voice, content, property and commerce. The Developer Platform turns those capabilities into infrastructure that external companies can consume through APIs, OAuth and webhooks.

### The strategic loop

`Consumer proof → trusted data/context → intelligence → API consumption → commercial usage → ecosystem expansion`

## 2. What a client can buy

### Build with Merveil

Companies can integrate selected Merveil capabilities into their own products instead of rebuilding identity, trust, connection, AI and voice infrastructure from scratch.

### Ask Merveil

The AI layer can be consumed through API requests with scoped credentials, usage controls and request-level observability.

### Grow with Merveil

Webhooks, usage metering, commercial plans and onboarding create a path from technical integration to recurring API revenue.

## 3. API capability map

| Domain | Client value |
|---|---|
| Identity | Read trusted profile/context where authorized |
| Passport | Access verification-aware identity context |
| Verification | Consume verification status |
| Connect | Create/discover connection workflows |
| Messages | Integrate communication workflows |
| AI | Add Merveil intelligence to products |
| Call | Integrate voice/call workflows |
| Companies | Company data and workflows |
| Properties | Property workflows |
| World | World content integrations |
| Investors | Investor intelligence/feed integrations |
| Credits | Credit-aware product experiences |
| Webhooks | Receive real-time platform events |
| OAuth | Delegated access architecture |
| Usage | Meter and manage consumption |
| Billing | Commercial account/invoice infrastructure |

## 4. Commercial model

Current platform plans:

- **Sandbox — $0**: development and evaluation.
- **Developer — $9/month**: early production integrations.
- **Growth — $49/month**: growing API usage.
- **Business — $199/month**: larger production integrations.
- **Enterprise**: custom commercial configuration.

These plans are the platform architecture, not a claim that live payment capture is currently certified. Live payment collection must be validated end-to-end before being represented as active revenue.

## 5. Trust and security story

The production QA pass verified or hardened:

- API scope enforcement.
- API key hashing and environment separation.
- Request IDs and rate/quota headers.
- Webhook signing and application-level delivery isolation.
- Webhook retry/outbox resilience.
- Supabase RLS on inspected public tables.
- Ownership restrictions for profile, property and World post updates.
- Restricted execution of inspected SECURITY DEFINER functions.
- Production 5xx scan clean in the latest QA window.

Do not describe the platform as fully security-certified. Physical-device and end-to-end certification remain required.

## 6. Production evidence

Current production deployment:

- Vercel project: `junction-app`
- Latest production deployment: `dpl_3HmppeUdJabfcvxyYMDr34sAR1g1`
- Deployment state: READY
- Latest deployment commit: `c4c9e941773fb4806d9842575c4488797647dff8`

Supporting records:

- `API_PRODUCTION_STATUS.md`
- `docs/deep-qa-2026-09-02.md`

## 7. What is ready to demonstrate

A strong investor/client demonstration should show:

1. Merveil Passport / trusted identity concept.
2. Connect and intelligent communication.
3. Merveil AI Assist.
4. Separate Merveil AI Call concept.
5. World Reels and Creator Studio.
6. Pulse Reels for real estate.
7. Investor and property workflows.
8. Arena and credit economy.
9. Developer Platform landing experience.
10. API Playground request/response with request ID, latency and credit usage.
11. API key/scopes/OAuth/webhooks/usage controls.
12. Commercial plan and client onboarding path.

## 8. Investor message

**Other platforms give you APIs. Merveil gives you an intelligence layer.**

The differentiation is not one isolated feature. It is the combination of trusted identity, human connection, AI, voice, world content and developer infrastructure under one platform architecture.

## 9. Investor questions — prepared answers

**Why is this more than a social app?**

Because the consumer application is the proof surface. The underlying capabilities are being exposed as reusable infrastructure through APIs, OAuth, webhooks and commercial usage controls.

**How does Merveil make money?**

Through consumer/product monetization plus recurring developer/API plans, usage and enterprise integrations. The API commercial layer is implemented; live payment capture still requires final provider verification.

**Why would companies use Merveil instead of building this themselves?**

Merveil packages trusted identity, verification context, connection, AI, voice and event infrastructure behind one integration boundary, reducing the need to assemble and secure each capability independently.

**Is it production ready?**

The infrastructure/API/security QA is in a strong production state and the current Vercel deployment is READY. Full certification still requires real-device and end-to-end testing for camera, WebRTC, voice, realtime, push, OAuth and payments.

## 10. Final pre-client gate

Before a public paid launch, complete:

- [ ] Android real-device regression.
- [ ] iOS real-device regression.
- [ ] Two-device WebRTC call test.
- [ ] AI Call microphone/voice/language test.
- [ ] Arena audio lifecycle test.
- [ ] Push notification test.
- [ ] Realtime Connect test.
- [ ] Camera/video upload test.
- [ ] OAuth consent test.
- [ ] Payment provider live-mode test.
- [ ] Remove/resolve DEP0169 warning where practical.
- [ ] Final production smoke test after the above changes.

## 11. Recommended investor demo language

Do not lead with a feature list.

Lead with the infrastructure thesis:

> Merveil started by solving trusted interaction for its own users. We then built the underlying intelligence, identity, trust, connection and voice infrastructure so other companies can use it too. The app is the proof. The API platform is the scale.
