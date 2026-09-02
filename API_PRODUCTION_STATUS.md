# Merveil AI API — Production Verification

Date: 2026-09-02

## Verified against live GitHub + Vercel + Supabase

- GitHub source of truth: `characeopriv-cyber/Merveil-AI-app`.
- Vercel project: `junction-app`.
- Vercel Git integration points to `characeopriv-cyber/Merveil-AI-app` on `main`.
- Latest Vercel production deployment inspected: `dpl_CxZ4VWxsXETaCf43avwwgfMaKVmD` — `READY`.
- That deployment was built from commit `8e70bb834522404b0aeef7091e7399699001d018` (`Wire Merveil Passport and Connect V1 routes`).
- GitHub `main` has newer commits than that deployment, including the Connect session compatibility fix at `8f5ef0d2dd9a9565899e6b2a815f2f8c9b640a15`. Therefore Vercel production was temporarily behind GitHub during this audit; do not label the GitHub head as deployed until a matching READY production deployment exists.
- `/api/diag?action=svc-check` confirmed the live service-role Supabase connection is healthy.
- Vercel runtime error scan for the last 7 days showed no application error/fatal cluster. The only cluster is Node `DEP0169` (`url.parse()` deprecation), 1,442 occurrences, last seen 2026-09-02.

## Current platform state

- Passport and Connect V1 are now backed by dedicated authenticated session/API routes in the repository; their latest implementation work is visible in GitHub, but route-level browser/device verification is still required.
- Merveil Interface/Discover V1 is implemented in the repository and has corresponding live database structures.
- Developer API, OAuth, webhook and commercial database structures exist. Their internal tables are intentionally RLS-protected and many have no client policies because privileged server/API routes are the intended access boundary. This is not evidence that the tables should be opened to anon/authenticated clients.
- The database currently reports 124 public tables.
- A hardening migration has revoked client execution of the legacy `merveil_interface_discovery(integer)` SECURITY DEFINER RPC and pinned the trigger function search path to `public`.

## Security QA

- All inspected public-schema tables are RLS-enabled.
- 23 inspected tables have RLS enabled with zero client policies. They remain default-deny to `anon`/`authenticated`; keep them that way unless a documented client access model requires a narrowly scoped policy.
- The legacy `merveil_interface_discovery(integer)` function is SECURITY DEFINER but is no longer executable by `anon` or `authenticated`.
- `merveil_interfaces_set_updated_at()` now has an explicit `search_path = public` and is not executable by client roles.
- API scope enforcement, API key hashing, webhook signing/isolation, webhook retry/outbox resilience and ownership-policy hardening remain part of the current API architecture.

## Remaining production gates

- Eliminate the Node `DEP0169` warning through dependency/runtime cleanup after identifying the emitting dependency; do not blindly rewrite application code because the warning is in dependency/runtime execution paths.
- Enable Supabase leaked-password protection in the Auth dashboard.
- Verify Passport, Connect, Admin Control Center, Discover, Arena audio, WebRTC, camera/video, push, OAuth consent and payment flows with real browser/device sessions.
- Verify the next Vercel production deployment is built from the current GitHub `main` head before treating this audit as fully synchronized.
- Do not describe the entire product as fully certified until these gates pass.

## Important interpretation

The commit history shows rapid first-pass V1 wiring on September 2, especially for Passport, Connect, Discover and the Admin Control Center. Those surfaces must be treated as **implemented V1 / verification pending**, not automatically as fully hardened or certified merely because they exist in the repository.
