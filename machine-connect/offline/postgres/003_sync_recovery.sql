-- Offline sync recovery hardening. Safe to run after 001_offline_schema.sql and 002_integrity_hardening.sql.

ALTER TABLE sync_queue
  ADD COLUMN IF NOT EXISTS next_attempt_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS claim_id uuid,
  ADD COLUMN IF NOT EXISTS dead_lettered boolean NOT NULL DEFAULT false;

ALTER TABLE sync_queue
  DROP CONSTRAINT IF EXISTS sync_queue_attempts_check;
ALTER TABLE sync_queue
  ADD CONSTRAINT sync_queue_attempts_check CHECK (attempts >= 0);

CREATE INDEX IF NOT EXISTS idx_offline_sync_ready
  ON sync_queue(next_attempt_at, created_at)
  WHERE synced = false AND dead_lettered = false;

CREATE INDEX IF NOT EXISTS idx_offline_sync_claims
  ON sync_queue(claimed_at)
  WHERE synced = false AND dead_lettered = false;

CREATE TABLE IF NOT EXISTS sync_conflicts (
  id bigserial PRIMARY KEY,
  sync_queue_id bigint NOT NULL REFERENCES sync_queue(id) ON DELETE CASCADE,
  table_name text NOT NULL,
  record_id text NOT NULL,
  local_data jsonb,
  remote_data jsonb,
  resolution text NOT NULL DEFAULT 'pending' CHECK (resolution IN ('pending','local_wins','remote_wins','manual')),
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_offline_sync_conflicts_pending
  ON sync_conflicts(created_at)
  WHERE resolution = 'pending';

CREATE TABLE IF NOT EXISTS sync_checkpoints (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  last_success_at timestamptz,
  last_failure_at timestamptz,
  last_queue_id bigint,
  last_error text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO sync_checkpoints (id)
VALUES (true)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION offline_sync_checkpoint_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_checkpoints_set_updated_at ON sync_checkpoints;
CREATE TRIGGER sync_checkpoints_set_updated_at
BEFORE UPDATE ON sync_checkpoints
FOR EACH ROW EXECUTE FUNCTION offline_sync_checkpoint_updated_at();
