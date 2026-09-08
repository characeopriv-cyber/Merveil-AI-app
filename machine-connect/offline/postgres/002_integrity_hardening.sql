-- Offline integrity hardening. Safe to run after 001_offline_schema.sql.

ALTER TABLE devices
  DROP CONSTRAINT IF EXISTS devices_status_check;
ALTER TABLE devices
  ADD CONSTRAINT devices_status_check
  CHECK (status IN ('online','offline','degraded','maintenance','disabled'));

ALTER TABLE commands
  DROP CONSTRAINT IF EXISTS commands_status_check;
ALTER TABLE commands
  ADD CONSTRAINT commands_status_check
  CHECK (status IN ('requested','authorized','approval_required','approved','dispatched','acknowledged','rejected','timed_out','failed','cancelled','emergency_stopped'));

ALTER TABLE commands
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION offline_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS devices_set_updated_at ON devices;
CREATE TRIGGER devices_set_updated_at
BEFORE UPDATE ON devices
FOR EACH ROW EXECUTE FUNCTION offline_set_updated_at();

DROP TRIGGER IF EXISTS commands_set_updated_at ON commands;
CREATE TRIGGER commands_set_updated_at
BEFORE UPDATE ON commands
FOR EACH ROW EXECUTE FUNCTION offline_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_offline_commands_pending
  ON commands(status, created_at)
  WHERE status IN ('requested','authorized','approved','dispatched');

CREATE INDEX IF NOT EXISTS idx_offline_audit_resource
  ON audit_logs(resource_type, resource_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_offline_sync_retry
  ON sync_queue(attempts, created_at)
  WHERE synced = false;
