-- Connector synchronization audit/idempotency ledger.
CREATE TABLE IF NOT EXISTS public.machine_connect_connector_syncs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  connector_id uuid NOT NULL REFERENCES public.machine_connect_connector_instances(id) ON DELETE CASCADE,
  machine_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  idempotency_key text NOT NULL,
  status text NOT NULL DEFAULT 'accepted' CHECK (status IN ('accepted','duplicate','failed')),
  telemetry_id uuid,
  job_id uuid,
  payload_digest text,
  bytes integer,
  latency_ms integer,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS machine_connect_connector_syncs_tenant_key_idx
  ON public.machine_connect_connector_syncs (organization_id, idempotency_key);
CREATE INDEX IF NOT EXISTS machine_connect_connector_syncs_connector_idx
  ON public.machine_connect_connector_syncs (organization_id, connector_id, created_at DESC);
CREATE INDEX IF NOT EXISTS machine_connect_connector_syncs_machine_idx
  ON public.machine_connect_connector_syncs (organization_id, machine_id, created_at DESC);

ALTER TABLE public.machine_connect_connector_syncs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS machine_connect_connector_syncs_select ON public.machine_connect_connector_syncs;
CREATE POLICY machine_connect_connector_syncs_select ON public.machine_connect_connector_syncs
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS machine_connect_connector_syncs_insert ON public.machine_connect_connector_syncs;
CREATE POLICY machine_connect_connector_syncs_insert ON public.machine_connect_connector_syncs
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS machine_connect_connector_syncs_update ON public.machine_connect_connector_syncs;
CREATE POLICY machine_connect_connector_syncs_update ON public.machine_connect_connector_syncs
  FOR UPDATE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  ));
