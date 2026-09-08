-- Closed-loop rule action metadata and durable execution ledger
ALTER TABLE public.machine_connect_operational_rules
  ADD COLUMN IF NOT EXISTS action jsonb NULL;

CREATE TABLE IF NOT EXISTS public.machine_connect_rule_actions (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  rule_id uuid NOT NULL,
  event_id uuid NOT NULL,
  command_id uuid NULL,
  action_type text NOT NULL CHECK (action_type IN ('command','twin_patch','none')),
  status text NOT NULL,
  correlation_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS machine_connect_rule_actions_event_rule_idx
  ON public.machine_connect_rule_actions (organization_id, rule_id, event_id);
CREATE INDEX IF NOT EXISTS machine_connect_rule_actions_org_created_idx
  ON public.machine_connect_rule_actions (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS machine_connect_rule_actions_command_idx
  ON public.machine_connect_rule_actions (organization_id, command_id)
  WHERE command_id IS NOT NULL;

ALTER TABLE public.machine_connect_rule_actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS machine_connect_rule_actions_select_member ON public.machine_connect_rule_actions;
CREATE POLICY machine_connect_rule_actions_select_member ON public.machine_connect_rule_actions
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  ));
