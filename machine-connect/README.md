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

## Initial domain

Tenant -> Machine -> Identity, Connection, Adapter, Capabilities, Telemetry, Events, Commands, Diagnostics, Evidence, Policies.

## Development rule

All Machine Connect work stays on feature/machine-connect until build, test, security, integration, and end-to-end verification pass. Do not merge to main prematurely.
