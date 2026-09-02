# Merveil AI — Ship Signal

This file marks the current main branch as the source of truth for the Merveil developer-platform release.

## Release boundary

- Public API v1 exposes one governed Merveil intelligence boundary.
- Capability routing is automatic and underlying providers remain hidden from API consumers.
- Sandbox credentials use `mv_test_*`; production credentials use `mv_live_*`.
- Developer Console supports applications, credential rotation/revocation, scopes, API Playground, usage, OAuth, webhooks, documentation and commercial plan/billing views.
- SDK source lives under `packages/merveil-sdk` and is not represented as publicly published to npm until a real package publication is completed.

## Production truth

The API health endpoint and catalog must return HTTP 200 on the active production deployment. Live payment capture, custom-domain DNS, and real-device certification remain operational gates rather than assumptions.

## Investor truth

Merveil currently owns the intelligence orchestration, governed API/developer layer, capability routing, domain context and product infrastructure. It integrates configured external model providers underneath that layer today; a proprietary foundation model is not claimed until one is actually trained and deployed.

## Deployment sync

Main-branch source changes should be promoted through the connected Vercel production deployment before the release is treated as current.

## CI verification

The repository CI validates the current API entrypoints (`api/v1.js`, `api/router.js`, and `api/assistant.js`) plus the Developer Console syntax check. This replaces the obsolete `api/v1/*.js` path assumption.
