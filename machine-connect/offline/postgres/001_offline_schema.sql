CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text UNIQUE NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  protocol text NOT NULL DEFAULT 'mqtt',
  capabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'offline',
  last_seen timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS telemetry (
  id bigserial PRIMARY KEY,
  device_id text NOT NULL REFERENCES devices(device_id),
  observed_at timestamptz NOT NULL DEFAULT now(),
  sequence_no bigint,
  data jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_offline_telemetry_device_time ON telemetry(device_id, observed_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_offline_telemetry_sequence ON telemetry(device_id, sequence_no) WHERE sequence_no IS NOT NULL;

CREATE TABLE IF NOT EXISTS commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL REFERENCES devices(device_id),
  idempotency_key text NOT NULL,
  command jsonb NOT NULL,
  status text NOT NULL DEFAULT 'requested',
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  acknowledged_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_offline_command_idempotency ON commands(device_id, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_offline_commands_device_time ON commands(device_id, created_at DESC);

CREATE TABLE IF NOT EXISTS rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger_type text NOT NULL DEFAULT 'telemetry',
  condition jsonb NOT NULL DEFAULT '{}'::jsonb,
  action jsonb NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sync_queue (
  id bigserial PRIMARY KEY,
  table_name text NOT NULL,
  record_id text NOT NULL,
  operation text NOT NULL CHECK (operation IN ('insert','update','delete')),
  data jsonb,
  synced boolean NOT NULL DEFAULT false,
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  synced_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_offline_sync_pending ON sync_queue(synced, created_at) WHERE synced = false;

CREATE TABLE IF NOT EXISTS audit_logs (
  id bigserial PRIMARY KEY,
  actor_id text,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
