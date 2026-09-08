-- Machine Connect — workflow reliability and observability
-- Safe to re-run.

CREATE INDEX IF NOT EXISTS machine_connect_workflow_execution_ready_idx
  ON public.machine_connect_workflow_executions (organization_id, available_at ASC)
  WHERE status = 'queued';

CREATE INDEX IF NOT EXISTS machine_connect_workflow_execution_lease_idx
  ON public.machine_connect_workflow_executions (organization_id, lease_until ASC)
  WHERE status IN ('leased','running') AND lease_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS machine_connect_workflow_execution_status_idx
  ON public.machine_connect_workflow_executions (organization_id, status, updated_at DESC);

ALTER TABLE public.machine_connect_workflow_executions
  DROP CONSTRAINT IF EXISTS machine_connect_workflow_execution_attempts_check;
ALTER TABLE public.machine_connect_workflow_executions
  ADD CONSTRAINT machine_connect_workflow_execution_attempts_check
  CHECK (attempts >= 0 AND attempts <= max_attempts);

ALTER TABLE public.machine_connect_workflow_executions
  DROP CONSTRAINT IF EXISTS machine_connect_workflow_execution_idempotency_length_check;
ALTER TABLE public.machine_connect_workflow_executions
  ADD CONSTRAINT machine_connect_workflow_execution_idempotency_length_check
  CHECK (length(idempotency_key) BETWEEN 1 AND 512);

CREATE INDEX IF NOT EXISTS machine_connect_workflow_execution_correlation_idx
  ON public.machine_connect_workflow_executions (organization_id, correlation_id);
