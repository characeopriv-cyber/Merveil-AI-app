# Machine Connect Enterprise Security Architecture

## Trust boundaries

- Machine devices authenticate with scoped machine credentials.
- Human users authenticate with Supabase sessions and organization membership.
- Core derives tenant identity from the authenticated principal.
- Intelligence processing is data-only and cannot dispatch machine commands.
- Operational secrets belong in managed secret/KMS infrastructure, never source control.

## Sensitive actions

Command dispatch, credential rotation, emergency-stop changes, key management and compliance administration require explicit authorization and should use step-up authentication when the deployment supports MFA/WebAuthn.

## Cryptography roadmap

Use modern platform cryptography today. Introduce hybrid post-quantum protection only through reviewed libraries and protocol support. For NIST-standardized PQC, evaluate ML-KEM for key establishment and ML-DSA for signatures; do not implement cryptography from scratch.

## Key management

The application should expose a provider abstraction for KMS/HSM/BYOK. Production key material must remain outside application source and ordinary database JSON fields.

## Auditability

Security-sensitive operations emit structured events with request/trace identifiers. Compliance evidence can be hash-linked so tampering becomes detectable.

## Data sovereignty

Organization residency policy determines where data may be stored/processed. Cross-region replication must respect contractual and regulatory restrictions.

## Security posture rule

A database table or API route is not considered an enterprise control merely because it exists. Controls become production claims only after authorization, integration, testing, monitoring and recovery procedures are verified.
