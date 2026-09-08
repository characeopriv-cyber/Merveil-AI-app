-- Machine Connect — closed-loop rule orchestration
-- Rules enqueue durable workflow executions; workers own execution.
-- Safe to re-run.

ALTER TABLE public.machine_connect_operational_rules
  ADD COLUMN IF NOT EXISTS action jsonb;

ALTER TABLE public.machine_connect_operational_rule_runs
  ADD COLUMN IF NOT EXISTS execution_id uuid;

ALTER TABLE public.machine_connect_operational_rule_runs
  DROP CONSTRAINT IF EXISTS machine_connect_operational_rule_runs_status_check;

ALTER TABLE public.machine_connect_operational_rule_runs
  ADD CONSTRAINT machine_connect_operational_rule_runs_status_check
  CHECK (status IN ('matched','queued','running','completed','failed','skipped'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'machine_connect_operational_rule_runs_execution_fk'
  ) THEN
    ALTER TABLE public.machine_connect_operational_rule_runs
      ADD CONSTRAINT machine_connect_operational_rule_runs_execution_fk
      FOREIGN KEY (execution_id)
      REFERENCES public.machine_connect_workflow_executions(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS machine_connect_operational_rule_runs_execution_idx
  ON public.machine_connect_operational_rule_runs (organization_id, execution_id)
  WHERE execution_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS machine_connect_operational_rules_action_idx
  ON public.machine_connect_operational_rules (organization_id, event_type, enabled)
  WHERE action IS NOT NULL;
