-- Device Twin Runtime V1
-- Durable versioning and tenant-safe lookup for machine twin snapshots.
ALTER TABLE public.machine_connect_twin_snapshots
  ADD COLUMN IF NOT EXISTS version bigint NOT NULL DEFAULT 1;

ALTER TABLE public.machine_connect_twin_snapshots
  ADD COLUMN IF NOT EXISTS source text;

ALTER TABLE public.machine_connect_twin_snapshots
  ADD COLUMN IF NOT EXISTS created_by uuid;

CREATE INDEX IF NOT EXISTS machine_connect_twin_snapshots_lookup_idx
  ON public.machine_connect_twin_snapshots (organization_id, machine_id, observed_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS machine_connect_twin_snapshots_version_idx
  ON public.machine_connect_twin_snapshots (organization_id, machine_id, version);

ALTER TABLE public.machine_connect_twin_snapshots
  DROP CONSTRAINT IF EXISTS machine_connect_twin_snapshot_version_positive;

ALTER TABLE public.machine_connect_twin_snapshots
  ADD CONSTRAINT machine_connect_twin_snapshot_version_positive CHECK (version > 0);

COMMENT ON TABLE public.machine_connect_twin_snapshots IS
  'Machine Connect durable device-twin snapshots. Tenant scoped; append-only history with monotonic version per machine.';
