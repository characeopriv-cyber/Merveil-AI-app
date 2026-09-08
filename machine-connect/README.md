# Machine Connect Core

Machine Connect is the machine connectivity and management engine inside the Merveil ecosystem.

## Architecture

- NestJS Core — API, machine registry, provisioning, adapters, capabilities, events, telemetry, commands.
- Python Intelligence Runtime — multimodal jobs, identification, anomaly detection, diagnostics, repair/rebuild planning, model routing.
- EMQX — MQTT connectivity and event gateway.
- PostgreSQL + TimescaleDB — authoritative registry and telemetry persistence.
- Redis — ephemeral state, distributed locks, idempotency.
- Object storage — camera/video/audio/evidence artifacts.
- Safety layer — policy evaluation, authorization, approval, emergency stop, acknowledgement and immutable audit.

## Runtime boundary

The Workbench is a client of Machine Connect Core. It must not manufacture machine state, telemetry, command results, diagnostics, or connectivity status.

## Safety boundary

Physical commands follow:

request -> authentication -> authorization -> policy evaluation -> safety evaluation -> approval (when required) -> dispatch -> acknowledgement -> audit

Emergency stop is a dedicated high-priority safety path.

## MQTT production transport

The core includes an optional MQTT adapter. It activates only when `MACHINE_CONNECT_MQTT_URL` is configured. The server-side bridge uses QoS 1, reconnects automatically, and exposes transport state through `/ready`.

Environment variables:

- `MACHINE_CONNECT_MQTT_URL` — broker URL, preferably `mqtts://...`.
- `MACHINE_CONNECT_MQTT_USERNAME` — broker service username.
- `MACHINE_CONNECT_MQTT_PASSWORD` — broker service password.
- `MACHINE_CONNECT_MQTT_CLIENT_ID` — optional stable bridge client ID.
- `MACHINE_CONNECT_MQTT_TLS_INSECURE` — leave unset/false in production; true is development-only.

Topic contract:

- `machine-connect/{tenantId}/{machineId}/telemetry`
- `machine-connect/{tenantId}/{machineId}/heartbeat`
- `machine-connect/{tenantId}/{machineId}/commands`
- `machine-connect/{tenantId}/{machineId}/acks`

Machine telemetry, heartbeat, and ACK messages must contain the issued machine credential. The credential is verified against the active hashed credential in Supabase and is not persisted as telemetry data. Commands are correlated with `commandId` and use QoS 1 publication.

## Initial domain

Tenant -> Machine -> Identity, Connection, Adapter, Capabilities, Telemetry, Events, Commands, Diagnostics, Evidence, Policies.

## Development rule

All Machine Connect work should be built, tested, security-reviewed, integration-tested, and end-to-end verified before being treated as production-complete.
