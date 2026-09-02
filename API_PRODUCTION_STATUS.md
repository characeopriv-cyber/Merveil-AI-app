# Merveil AI API — Production Verification

Date: 2026-09-02

## Verification

- `/api/v1/health` — operational on the current production deployment.
- `/api/v1/catalog` — implemented in `api/v1.js` and ready for the next production deployment.
- API v1 exposes request IDs, API-key authentication, OAuth bearer authentication, scopes, rate-limit/quota headers, usage metering, webhooks, and developer application routes.

## Deployment note

The GitHub `main` branch contains the API catalog implementation, while the currently aliased Vercel production deployment predates those catalog commits. A fresh Git-triggered production deployment is required before client-facing API verification is considered complete.

## Deployment trigger

This commit intentionally refreshes the production verification marker so the connected Vercel project receives a new `main` branch deployment from the complete API platform state.
