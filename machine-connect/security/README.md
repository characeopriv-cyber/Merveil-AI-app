# Machine Connect Security Operations

Security is a platform capability, not a separate bypass path.

## Control flow

Detection -> normalized security event -> correlation -> alert/incident -> approved remediation proposal -> authorization -> Machine Connect safety pipeline -> controlled adapter -> result -> audit -> retest.

## Adversary emulation

The CALDERA bridge is control-plane only. Campaigns require explicit targets and approval and expire. Execution belongs to an isolated worker with private networking, resource limits, short-lived credentials and an allow-list. The Core API never accepts arbitrary shell commands or arbitrary plugin identifiers.

## Verification checks

Custom checks are pre-installed and registered by trusted code. User input selects an existing check ID and validated target; it cannot supply executable code, shell syntax or dynamic module paths. Real exploit payloads are intentionally outside the Core API.

## Remediation

Remediation is proposal/approval based. The requester cannot self-approve. Actions are tenant-isolated, idempotent and time-bounded. A remediation result does not itself authorize a new machine command; any consequential command must pass the normal authorization and safety pipeline again.

## Platform self-security

Emit authentication, authorization, rate-limit, integrity, dependency, configuration, availability and data-access events into the security event stream. Correlation produces alerts; it does not silently disable infrastructure.

## Production requirements

- OIDC/JWT validation at the edge and server-side authorization.
- TLS/mTLS where supported by the transport and device.
- Secrets only in a secret manager/environment, never Git.
- Private CALDERA/scanner networks; no public management ports.
- Signed/immutable audit strategy for production.
- Dependency, SAST, secret and container scanning in CI.
- Readiness/liveness probes and bounded retry/backoff.
- Offline edge mode must fail closed for unauthorized commands and reconcile through signed/idempotent events.
