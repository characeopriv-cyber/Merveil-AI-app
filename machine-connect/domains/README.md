# Machine Connect Domain Modules

Domain modules are adapters, schemas, analytics and policy-aware workflows built on top of the Machine Connect core.

## Initial domains

- Healthcare & telemedicine
- Agriculture & food security
- Energy
- Smart cities
- Supply chain & logistics
- Environmental monitoring
- Space & satellite telemetry

## Boundary

Domain modules MUST use the Machine Connect contracts for identity, telemetry, events, commands, audit and safety. A domain module may observe and recommend actions, but it must not bypass authorization, approval, emergency-stop state or the command safety pipeline.

High-impact domains (healthcare, public safety, energy, space) default to human review for consequential actions. AI models are advisory unless an explicit policy authorizes a bounded automated workflow.

## Implementation approach

The first release uses TypeScript domain contracts and Python intelligence workers where ML is appropriate. Heavy ML runtimes, hardware SDKs and vendor-specific binaries stay in isolated workers rather than the Core API.

Each domain should expose:

1. `contracts/` — validated input/output schemas.
2. `adapters/` — protocol/vendor translation.
3. `intelligence/` — analysis and forecasting.
4. `policies/` — authorization and safety constraints.
5. `tests/` — deterministic unit and integration tests.

Never put device credentials, private keys, healthcare records, blockchain wallet secrets or cloud credentials in source control.
