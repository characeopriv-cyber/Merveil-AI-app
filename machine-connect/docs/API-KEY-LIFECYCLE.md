# Machine Connect API Key Lifecycle

## Security contract

API secrets are generated once and returned once. Only a SHA-256 digest is persisted; list and audit responses never contain the secret.

## Lifecycle

1. Owner/admin creates a named key.
2. Client stores the returned secret in its secret manager.
3. Requests authenticate with the secret through the service boundary.
4. Usage metadata records prefix, actor, tenant, request and timestamp; never the secret.
5. Owner/admin revokes the key immediately when compromised.
6. Rotation creates a new secret before the old credential is retired.
7. Expired or revoked credentials are rejected.

## Operational requirements

- Never log request headers containing credentials.
- Prefer KMS/HSM-backed secret distribution for enterprise deployments.
- Use short-lived credentials where an upstream identity provider supports them.
- Emit `created`, `used`, `revoked`, `rotated`, and `rate_limited` events to the security ledger.
