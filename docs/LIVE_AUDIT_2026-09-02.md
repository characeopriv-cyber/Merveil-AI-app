# Merveil AI — Live GitHub / Vercel / Supabase Audit

**Audit date:** 2026-09-02

## Source of truth

- GitHub repository: `characeopriv-cyber/Merveil-AI-app`
- Default branch: `main`
- Vercel project: `junction-app`
- Vercel project is Git-connected to the GitHub repository above.
- Supabase project: `dixfybqlepticyudikuz`

## Findings and fixes

### 1. Vercel was behind GitHub

The latest READY production deployment inspected was built from `8e70bb8` (`Wire Merveil Passport and Connect V1 routes`), while GitHub `main` had subsequently advanced through the Connect session fix and the audit/hardening commits.

**Action:** documentation was corrected to distinguish GitHub HEAD from the currently deployed production commit. GitHub pushes are triggering Vercel production deployments; the new hardening commit is now queued for production.

### 2. Passport / Connect / Discover / Admin status

The repository contains real V1 route/components for Passport, Connect, Discover and the Admin Control Center. However, the September 2 commit trail shows these surfaces were actively being wired and hardened on that date. They are therefore classified as **implemented V1 / verification pending**, not fully certified.

The Admin Control Center component contains both customer and developer control surfaces, but several cards explicitly describe controls as ready for future full operational controls. This supports treating it as a real V1 control surface with verification still required, rather than calling every administrative capability complete.

### 3. RLS zero-policy tables

The production database has 124 public tables. 23 inspected tables have RLS enabled and zero policies. These tables remain default-deny to client roles. For internal admin, billing, OAuth, audit and API-internal data, this is safer than opening them with broad client policies because the intended access boundary is the privileged server/API layer.

**Action:** no broad RLS policies were added. The audit wording was corrected so zero-policy RLS tables are not incorrectly treated as a security failure.

### 4. Legacy SECURITY DEFINER discovery RPC

`public.merveil_interface_discovery(integer)` was SECURITY DEFINER and executable by authenticated users. The active application discovery endpoint instead uses the newer `merveil_unified_discovery` RPC through the server-side service-role client.

**Action:** client execution of the legacy function was revoked and its search path pinned to `public`.

### 5. Mutable trigger search path

`merveil_interfaces_set_updated_at()` had no explicit search path.

**Action:** search path is now explicitly `public`, and client execution was revoked.

### 6. Runtime warning

Vercel runtime telemetry shows only Node `DEP0169` (`url.parse()` deprecation), with 1,442 occurrences in the inspected seven-day window and no application error/fatal cluster.

**Action:** not blindly changed. The warning appears in dependency/runtime execution paths, so dependency identification must precede a safe fix.

### 7. Auth leaked-password protection

Leaked-password protection remains a Supabase Auth configuration item and was not changed through the available database SQL interface.

**Required action:** enable leaked-password protection in the Supabase Auth dashboard, then re-run the security advisor.

## Verification rules going forward

1. A feature is `IMPLEMENTED V1` when code/routes/database support exist.
2. A feature is `PRODUCTION VERIFIED` only after live route testing and relevant browser/device testing pass.
3. A feature is `CERTIFIED` only after security, realtime, device, OAuth/payment and regression gates relevant to that feature pass.
4. Never use an old deployment ID in production-status documentation.
5. Never open internal RLS tables merely to make an admin UI work; use the intended privileged API boundary or add narrowly scoped policies only where client access is genuinely required.
