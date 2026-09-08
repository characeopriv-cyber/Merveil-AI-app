# Machine Connect Offline Runtime

This stack provides a local-first Machine Connect deployment for disconnected or constrained environments.

## Data path

`simulator -> EMQX -> telemetry-processor -> PostgreSQL -> sync_queue`

The NestJS Core remains the control-plane boundary. The offline stack does not bypass authorization, safety policy, signed acknowledgements, idempotency, or audit requirements in Core.

## Start

From this directory:

```bash
docker compose up --build
```

Optional Node-RED automation:

```bash
docker compose --profile automation up --build
```

## Services

- EMQX: MQTT broker on `1883`
- PostgreSQL: local persistence on `5432`
- Core: API on `4100`
- Telemetry processor: MQTT-to-PostgreSQL ingestion
- Simulator: deterministic test sensor publishing every few seconds
- Node-RED: optional automation profile

## Security requirements

- Never commit production passwords, API keys, certificates, or machine credentials.
- Copy `.env.example` to `.env` and replace all secrets before shared use.
- Keep the offline network private; do not expose PostgreSQL or EMQX administration publicly.
- Treat simulator traffic as test traffic only.
- Production machine credentials and signed ACK keys must be provisioned through the Core security boundary.

## Verification

After startup, verify the service health endpoints and inspect PostgreSQL for telemetry rows. Duplicate `(device_id, sequence_no)` telemetry is rejected by the database uniqueness constraint, and malformed MQTT payloads are audited by the processor.
