# Merveil AI API — Production Verification

Date: 2026-09-02

## Verified against live GitHub + Vercel + Supabase

- GitHub source of truth: `characeopriv-cyber/Merveil-AI-app`.
- Vercel project: `junction-app`.
- Vercel Git integration points to `characeopriv-cyber/Merveil-AI-app` on `main`.
- The latest previously READY production deployment was `dpl_CxZ4VWxsXETaCf43avwwgfMaKVmD`, built from `8e70bb8`.
- GitHub `main` subsequently advanced through the session hardening, audit and Vercel function-count fix commits. Production must be considered synchronized only after a matching READY deployment for the current GitHub head.
- `/api/diag?action=svc-check` confirmed the live service-role Supabase connection is healthy.
- Vercel runtime telemetry showed no application error/fatal cluster in the inspected seven-day window. The only cluster was Node `DEP0169` (`url.parse()` deprecation), 1,442 occurrences at audit time.

## Current platform state

- Passport and Connect V1 are backed by authenticated session APIs. To stay within the Vercel Hobby 12-function limit, the auth, Passport and Connect session handlers have been consolidated into `api/session.js` with explicit rewrites from their public routes.
- Merveil Interface/Discover V1 is implemented in the repository and has corresponding live database structures.
- Developer API, OAuth, webhook and commercial database structures exist. Internal tables are intentionally RLS-protected and many have no client policies because privileged server/API routes are the intended access boundary. Do not open these tables merely to make an admin UI work.
- The database currently reports 124 public tables.
- A production hardening migration revoked client execution of the legacy `merveil_interface_discovery(integer)` SECURITY DEFINER RPC and pinned the trigger function search path to `public`.

## Security QA

- All inspected public-schema tables are RLS-enabled.
- 23 inspected tables have RLS enabled with zero policies. They remain default-deny to `anon`/`authenticated` and are treated as internal/privileged data unless a documented client access model requires a narrow policy.
- The legacy `merveil_interface_discovery(integer)` function is SECURITY DEFINER but is no longer executable by `anon` or `authenticated`.
- `merveil_interfaces_set_updated_at()` now has an explicit `search_path = public` and is not executable by client roles.
- API scope enforcement, API key hashing, webhook signing/isolation, webhook retry/outbox resilience and ownership-policy hardening remain part of the current API architecture.

## Remaining production gates

- Confirm a READY Vercel deployment built from the current GitHub `main` head after the session consolidation. The previous deployment failures were caused by the Vercel Hobby limit of 12 Serverless Functions per deployment.
- Eliminate the Node `DEP0169` warning through dependency/runtime cleanup after identifying the emitting dependency; do not blindly rewrite application code.
- Enable Supabase leaked-password protection in the Auth dashboard.
- Verify Passport, Connect, Admin Control Center, Discover, Arena audio, WebRTC, camera/video, push, OAuth consent and payment flows with real browser/device sessions.
- Do not describe the entire product as fully certified until these gates pass.

## Important interpretation

The September 2 commit trail shows rapid first-pass V1 wiring and hardening for Passport, Connect, Discover and the Admin Control Center. These surfaces are **implemented V1 / verification pending**, not automatically certified because their code exists.
