# Machine Connect Offline Sync Transport Contract

Status: transport boundary only. No queue item may be marked synced until an authenticated cloud Core acknowledgement is received.

## Purpose

Define the safe boundary between the offline store and the cloud Machine Connect Core. Offline storage remains authoritative for local continuity; cloud Core remains authoritative for cloud control-plane state.

## Transport requirements

1. Authenticate the offline node with a provisioned machine-connect credential. Never embed credentials in source control.
2. Send queued records with a stable `sync_queue.id` and an idempotency key derived from that queue identity.
3. Require an explicit cloud acknowledgement containing the queue identity, accepted/rejected outcome, and server record identifier where applicable.
4. Mark `sync_queue.synced = true` only after that acknowledgement is cryptographically/authentically validated.
5. On rejection, retain the queue row and record the reason. Do not silently discard data.
6. On conflict, create `sync_conflicts` and require a defined resolution policy.
7. Retry with bounded exponential backoff using `next_attempt_at`; reclaim stale claims after a lease timeout.
8. Dead-letter only after a configured retry ceiling and preserve the original payload plus failure reason.
9. Update `sync_checkpoints` only after a confirmed transport result.
10. Never replay physical commands merely because they are present in an offline queue. Command reconciliation must pass through the cloud/Core authorization and safety path.

## Reconciliation rules

### Telemetry

Telemetry is append-oriented. Duplicate delivery must be idempotent using the device identity and sequence number/event identity. Cloud acceptance is required before the local queue row is completed.

### Device metadata

Device metadata updates require version/timestamp conflict handling. Last-write-wins must not be used blindly for security-sensitive fields such as credentials, authorization state, or safety state.

### Commands

Offline command records are evidence of requested work, not authorization to execute work in the cloud. Cloud Core must independently authenticate, authorize, evaluate policy/safety, and dispatch. A sync process must never bypass those controls.

## Failure semantics

- Network unavailable: leave row pending and schedule retry.
- Authentication failure: stop transport and alert; do not mark synced.
- Validation rejection: retain row, record rejection, and do not retry indefinitely.
- Conflict: persist conflict and pause that record until resolution.
- Unknown server result: treat as unconfirmed; retry with the same idempotency key.
- Successful acknowledgement: atomically record acknowledgement/checkpoint and mark the queue item synced.

## Implementation boundary

The future transport adapter should expose only authenticated operations such as:

- `pushTelemetry(batch)`
- `pushDeviceMetadata(change)`
- `reconcileCommand(commandEnvelope)`
- `health()`

The adapter must not own safety policy or invent authoritative machine state. Those responsibilities stay in Core.
