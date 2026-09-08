-- Machine Connect — autonomous workflow worker indexes
-- Safe to re-run. No data mutation.

CREATE INDEX IF NOT EXISTS machine_connect_workflow_executions_queue_idx
  ON public.machine_connect_workflow_executions (status, available_at ASC)
  WHERE status = 'queued';

CREATE INDEX IF NOT EXISTS machine_connect_workflow_executions_lease_idx
  ON public.machine_connect_workflow_executions (status, lease_until ASC)
  WHERE status IN ('leased', 'running');

CREATE INDEX IF NOT EXISTS machine_connect_workflow_executions_tenant_status_idx
  ON public.machine_connect_workflow_executions (organization_id, status, updated_at DESC);
