-- Machine Connect connector health state.
-- Health checks are controlled, bounded, and never persist credentials or response bodies.

ALTER TABLE public.machine_connect_connector_instances
  ADD COLUMN IF NOT EXISTS last_health_check_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_latency_ms integer,
  ADD COLUMN IF NOT EXISTS health_status text NOT NULL DEFAULT 'unknown'
    CHECK (health_status IN ('unknown','healthy','degraded','unreachable','blocked'));

CREATE INDEX IF NOT EXISTS idx_mc_connector_health
  ON public.machine_connect_connector_instances(organization_id, health_status, last_health_check_at DESC);

COMMENT ON COLUMN public.machine_connect_connector_instances.last_latency_ms IS
  'Most recent controlled connector health-check latency; no credential material.';
COMMENT ON COLUMN public.machine_connect_connector_instances.health_status IS
  'Control-plane health result. Does not imply provider correctness or safety.';
