CREATE TABLE IF NOT EXISTS public.machine_connect_workflow_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  rule_id uuid NOT NULL,
  event_id uuid NOT NULL,
  correlation_id uuid NOT NULL,
  idempotency_key text NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','leased','running','completed','failed','cancelled')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  max_attempts integer NOT NULL DEFAULT 3 CHECK (max_attempts BETWEEN 1 AND 10),
  available_at timestamptz NOT NULL DEFAULT now(),
  lease_until timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS machine_connect_workflow_execution_idem_idx ON public.machine_connect_workflow_executions (organization_id,idempotency_key);
CREATE INDEX IF NOT EXISTS machine_connect_workflow_execution_queue_idx ON public.machine_connect_workflow_executions (organization_id,status,available_at);
CREATE INDEX IF NOT EXISTS machine_connect_workflow_execution_event_idx ON public.machine_connect_workflow_executions (organization_id,event_id);
ALTER TABLE public.machine_connect_workflow_executions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS workflow_execution_select ON public.machine_connect_workflow_executions;
CREATE POLICY workflow_execution_select ON public.machine_connect_workflow_executions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.organization_members om WHERE om.organization_id = machine_connect_workflow_executions.organization_id AND om.user_id = auth.uid()));
