# Merveil AI API — Production Verification

Date: 2026-09-02

## Verified

- `/api/v1/health` — HTTP 200 and operational on the current production deployment.
- `/api/v1/catalog` — implemented in `api/v1.js` and deployed with the current production build.
- API v1 exposes request IDs, API-key authentication, OAuth bearer authentication, scopes, rate-limit/quota headers, usage metering, webhooks, billing/onboarding, and developer application routes.
- Current production deployment: `dpl_3HmppeUdJabfcvxyYMDr34sAR1g1`.
- Current production deployment state: `READY`.
- Current deployment commit: `c4c9e941773fb4806d9842575c4488797647dff8`.
- Runtime error scan for the current deployment: no application error/fatal logs detected.
- Production 5xx scan for the last 24 hours: no 5xx request paths reported.

## Security QA

- All public-schema tables inspected are RLS-enabled.
- API-specific SECURITY DEFINER functions are not executable by `anon` or `authenticated` roles.
- Fixed three ownership-policy gaps found during QA: profile updates, property updates, and World post updates now include `WITH CHECK` ownership enforcement.

## Known verification limits

- Browser/device interaction testing (camera, microphone, WebRTC, mobile autoplay, native push, and physical-device audio) still requires a real browser/device session.
- A Node `DEP0169` deprecation warning remains in production runtime telemetry (`url.parse()` behavior). It is currently a warning rather than an application failure and appears in dependency/runtime execution paths; it should be eliminated in a future dependency/runtime cleanup pass.
- Live payment collection remains provider/configuration dependent; the commercial billing architecture is present, but this document does not claim live money capture without a verified payment transaction.
