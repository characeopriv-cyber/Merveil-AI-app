# Merveil Machine Connect Core

Machine Connect is the physical-intelligence boundary of the Merveil ecosystem.

## Runtime boundaries

- `api/` — authenticated edge/API surface
- `core/` — platform contracts and machine state model
- `adapters/` — protocol/device adapters
- `intelligence/` — Python multimodal/diagnostic workers
- `gateway/` — edge gateway runtime
- `database/` — PostgreSQL/Supabase schema
- `simulator/` — safe digital-machine simulators

## Design rules

1. Unknown protocols and capabilities fail closed.
2. AI may propose actions; safety/policy decides whether execution is permitted.
3. Physical emergency-stop mechanisms always remain authoritative.
4. Every command has an idempotency key and audit record.
5. Telemetry is append-oriented and never treated as a command acknowledgement.
6. Device credentials and certificates are never stored in source control.
