# PULSE Edge — Offline-First Engineering Runtime

PULSE Edge is the local execution layer for PULSE Engineering. It keeps machine identity, telemetry, evidence, diagnosis, safety evaluation, procedure execution, audit logging, and store-and-forward synchronization available when cloud connectivity is unavailable.

## Operating modes

- ONLINE — local runtime can use cloud services and reconcile queued state.
- DEGRADED — cloud unavailable; local services continue.
- AIR-GAPPED — no external network dependency; only explicitly attached local systems are reachable.
- RECOVERY/SYNC — connectivity returns; queued records are uploaded with idempotent envelopes.

## Safety invariant

Loss of internet must never weaken a machine's safety boundary. Local authorization and safety policy remain authoritative. AI models may recommend actions, but deterministic safety gates and verified machine feedback determine whether an action may proceed.

## Core flow

Machine → Local Adapter → Local MQTT/REST → PULSE Edge → Machine DNA → Evidence/Telemetry → Local Diagnosis → Safety Governor → Procedure Engine → Machine Feedback → Audit → Sync Queue → Machine Connect Cloud

## Edge storage

SQLite is the default local store because it is portable and supports WAL mode. The edge database is a local projection/cache/queue, not a competing cloud architecture. Cloud records map to the existing machine_connect_* services and tables during synchronization.

Every locally generated record should carry stable IDs, timestamps, source, schema version and sync state. Telemetry and command idempotency data must survive restart so retries cannot silently duplicate operations.

## Offline diagnosis

Local inference may use ONNX/TFLite or deterministic engineering rules. A diagnostic result records model name, version and integrity hash when a model is used. Missing or invalid models produce an explicit model_unavailable state; PULSE must never fabricate a diagnosis.

Multimodal evidence can include telemetry, vibration, acoustic signals, images and video. Evidence capture remains useful even when analysis is deferred until a compatible local model is available.

## Procedure execution

Procedures are stateful and time-aware. A step may specify prerequisites, safety checks, minimum duration, maximum duration, timeout, expected machine feedback, approval requirements and recovery behavior. A timeout or unexpected machine state fails closed unless the procedure explicitly defines a safe recovery transition.

## Synchronization

Sync is store-and-forward. Every queued operation has a stable queue ID and idempotency key. Uploads may be retried safely. Connectivity recovery must not require the operator to repeat a machine procedure.

When cloud connectivity is unavailable for an extended period, the edge must continue within its local retention and storage limits and surface capacity warnings before the queue is exhausted.

## Air-gapped transfer

For environments where networking is prohibited, a future signed export/import workflow can move approved records or model bundles using controlled removable media. Imported data must be authenticated, integrity-checked and replay-protected before entering the local runtime.

## Production verification gate

Before calling an installation offline-production ready, verify:

1. Target machine adapter works against the real protocol/interface.
2. Local MQTT/REST remains functional with WAN disconnected.
3. Database survives restart and controlled power-loss testing.
4. Evidence remains available without cloud storage.
5. Diagnostic results contain model provenance.
6. Local authorization and safety policy continue to block unsafe commands.
7. Commands require verified machine feedback where applicable.
8. Queued records synchronize without duplication.
9. Clock drift and timestamp provenance are handled explicitly.
10. Audit logs remain tamper-evident.
11. Disk/queue exhaustion is detected before data loss.
12. Model bundles and edge software are integrity-verified before activation.

## Important limitation

Offline does not mean omnipotent. A machine must expose a usable physical/electrical interface, have sufficient power, and permit the requested operation. PULSE can identify, inspect and guide recovery for many legacy machines, but it cannot recover physically destroyed storage, bypass encryption, or safely control hardware for which no compatible interface exists.
