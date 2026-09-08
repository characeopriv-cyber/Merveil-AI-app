# PULSE Edge — Offline Engineering Runtime

PULSE Edge is the offline/air-gapped execution layer for PULSE Engineering. It is designed for rugged laptops, industrial PCs and edge servers at sites where cloud connectivity is unavailable or prohibited.

## Design rules

- The cloud Machine Connect schema remains the system of record when connected; Edge uses a local cache/queue and does **not** create a competing cloud architecture.
- No internet is required for local machine discovery, evidence capture, telemetry processing, diagnostic rules, procedure execution, or audit logging.
- Physical commands are never executed merely because an AI model recommends them. Every command passes local identity, authorization, machine-state and safety gates.
- Evidence and operational records are stored locally and synchronized through the existing Machine Connect offline-sync API when connectivity returns.
- Local model inference is optional and versioned. A model may recommend a diagnosis, but deterministic safety rules remain authoritative.

## Runtime

```text
Machine / Sensor
      |
 Local protocol adapter
      |
 PULSE Edge Gateway
      +---- SQLite durable cache/queue
      +---- Evidence store
      +---- Diagnostic engine
      +---- Procedure engine
      +---- Safety governor
      +---- Local audit log
      +---- Optional ONNX/TFLite model runner
      |
 Local UI / REST / MQTT
      |
 Store-and-forward sync
      |
 Machine Connect Cloud
```

## Supported operating modes

- **Offline:** all local services continue; records remain queued.
- **Online:** local services continue and the sync worker drains the queue.
- **Air-gapped:** no network path to the cloud is required; export/import can be performed through an approved removable-media workflow later.
- **Degraded:** if an AI model is unavailable, deterministic diagnostics and machine procedures can still run where their prerequisites are satisfied.

## Important limitation

Offline does not mean omnipotent. A machine must expose a usable physical/electrical interface, have sufficient power, and permit the requested operation. PULSE can identify, inspect and guide recovery for many legacy machines, but it cannot recover physically destroyed storage, bypass encryption, or safely control hardware for which no compatible interface exists.
