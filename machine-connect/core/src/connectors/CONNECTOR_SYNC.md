# Connector synchronization contract

`POST /api/connectors/:id/sync` executes one bounded, tenant-scoped synchronization.

## Current adapter

- `https` + `http.generic`
- GET only
- HTTPS destination only
- redirects are rejected
- private, loopback, link-local and localhost destinations are rejected
- 5 second timeout
- 64 KiB response limit
- JSON and `text/plain` responses only
- credentials are never read from `configuration` or returned by the sync response

## Idempotency

Clients may send `idempotencyKey` in the JSON body or `x-idempotency-key` header. Keys are scoped to the organization. A repeated key returns the prior telemetry/job identifiers and does not make another network request.

## Pipeline

Connector -> bounded adapter -> normalized telemetry -> `connector_sync` intelligence job -> downstream intelligence processing.

Unsupported protocols are rejected rather than silently falling back to an unrestricted network adapter. MQTT, WebSocket, Modbus and OPC-UA require dedicated adapters with protocol-specific security controls before activation.
