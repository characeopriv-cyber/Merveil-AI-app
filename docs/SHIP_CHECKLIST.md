# Merveil AI — Final Platform Ship Checklist

## Product
- Merveil is positioned as an intelligence layer beyond interaction, not only a consumer app.
- Consumer products remain the flagship proof surface: Passport, Connect, AI Assist, AI Call, World, Pulse (real estate), Investor intelligence, Souk/Work and Arena.
- Merveil AI Call remains distinct from Merveil AI Assist.

## Developer Platform
- Unified `/api/v1/ai` intelligence boundary.
- Capability-aware routing with provider abstraction and fallback.
- Core capability families: intelligence, voice, connection, trust, world, real estate, business, capital and trading.
- API credentials support test/live environments.
- OAuth and API-key authentication are supported.
- Request IDs, rate limits, quota headers and usage metering are part of the API contract.
- Webhooks support signed delivery, retries, replay and delivery history.
- Commercial organization/subscription/billing architecture exists.
- OpenAPI specification is maintained in `docs/openapi-v1.1.json`.
- JavaScript SDK and TypeScript declarations are maintained under the SDK package.

## Commercial Flow
Developer Portal -> create account/app -> sandbox credential -> API Playground -> integration -> usage -> plan upgrade -> live credential -> billing.

## Production Gates
1. Vercel production deployment must be READY for the latest main commit.
2. `api.merveil.ai/api/v1/health` must return HTTP 200.
3. Catalog and OpenAPI must agree on public routes and capability names.
4. No new 5xx runtime errors.
5. Supabase RLS and ownership policies remain enforced.
6. Privileged database functions remain inaccessible to anon/authenticated clients.
7. Live payment capture/webhook must be tested before declaring billing fully certified.
8. Real-device certification remains required for camera, microphone, WebRTC, AI Call voice/language, realtime Connect, Arena audio, notifications, OAuth consent and media upload.

## Investor Truthfulness
Merveil currently owns the intelligence orchestration/developer layer and integrates external model providers underneath it. Do not describe Merveil as owning a foundation model until a proprietary model is actually trained/deployed.

## Definition of Done
The platform is considered fully shipped only when the production deployment, API smoke tests, billing test, security checks and real-device certification gates above are completed. Until then, describe the platform as production-ready architecture with remaining certification gates, not as 100% certified.
