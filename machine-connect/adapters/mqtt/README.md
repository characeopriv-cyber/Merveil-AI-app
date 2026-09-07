# MQTT Adapter

Normalized Machine Connect MQTT transport.

Topics:
- `devices/{machineId}/telemetry`
- `devices/{machineId}/events`
- `devices/{machineId}/command`
- `devices/{machineId}/response`

Production requirements: TLS, per-machine credentials/certificates, ACLs, bounded payloads, schema validation and reconnect backoff. Secrets never belong in source control.

Commands received here are forwarded to Core's authorization/safety pipeline; adapters must never bypass policy or emergency-stop state.
