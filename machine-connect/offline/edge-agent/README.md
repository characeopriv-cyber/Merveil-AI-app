# PULSE Offline Edge Agent

The PULSE edge agent is the local execution layer for machines that must remain useful when Internet/cloud connectivity is unavailable.

## What works offline

- Local machine state and telemetry capture.
- Local evidence persistence in SQLite.
- Deterministic sequence numbers and SHA-256 content hashes.
- Store-and-forward synchronization after connectivity returns.
- Explicitly pre-authorized low-risk/local diagnostic commands.
- Local command result and audit state.

## What does not happen automatically offline

- Cloud AI inference.
- Cloud database writes.
- Credential issuance or rotation.
- Critical physical commands.
- Security bypasses or authentication bypasses.

A local protocol adapter (OBD/CAN, serial, Modbus, BLE, USB, MQTT, etc.) can feed the edge agent. The edge agent does not assume that a machine is controllable merely because it is detectable.

## Offline-first algorithm

1. Discover machine and validate its local identity.
2. Select a supported local adapter.
3. Read telemetry/evidence locally.
4. Validate and persist the observation before attempting network delivery.
5. Assign a monotonically increasing sequence number and content hash.
6. Add the observation to the durable outbox.
7. Continue operating when the cloud is unavailable.
8. For an action, require explicit local authorization and an allow-listed capability.
9. Refuse critical actions while offline by default.
10. When connectivity returns, upload outbox records in sequence order using idempotency/sequence checks.
11. Mark only confirmed records as synchronized; failed records remain queued with bounded exponential backoff.
12. Reconcile cloud state and continue normal online operation.

## Target topology

```text
                 INTERNET AVAILABLE
Machine <-> PULSE Edge <-> PULSE Cloud <-> Supabase / AI
              |
              +---- local SQLite
              +---- local protocol adapters
              +---- local safety policy

                 INTERNET DOWN
Machine <-> PULSE Edge
              |
              +---- telemetry/evidence
              +---- local diagnostics
              +---- approved local actions
              +---- durable queue

                 INTERNET RETURNS
PULSE Edge ---- store-and-forward ----> PULSE Cloud
```

This is complementary to the existing Machine Connect cloud offline-sync endpoint; it does not create a second machine data model.
