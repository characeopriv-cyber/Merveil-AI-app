CREATE TABLE IF NOT EXISTS public.machine_connect_operational_events (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  machine_id uuid,
  event_type text NOT NULL,
  source text NOT NULL,
  occurred_at timestamptz NOT NULL,
  correlation_id uuid NOT NULL,
  causation_id uuid,
  schema_version integer NOT NULL DEFAULT 1,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS machine_connect_operational_events_lookup_idx
  ON public.machine_connect_operational_events (organization_id, machine_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS machine_connect_operational_events_type_idx
  ON public.machine_connect_operational_events (organization_id, event_type, occurred_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS machine_connect_operational_events_idempotency_idx
  ON public.machine_connect_operational_events (organization_id, machine_id, event_type, causation_id)
  WHERE causation_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.machine_connect_operational_rules (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  name text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  event_type text NOT NULL,
  conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  cooldown_seconds integer NOT NULL DEFAULT 0 CHECK (cooldown_seconds BETWEEN 0 AND 86400),
  last_triggered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS machine_connect_operational_rules_lookup_idx
  ON public.machine_connect_operational_rules (organization_id, event_type, enabled);

CREATE TABLE IF NOT EXISTS public.machine_connect_operational_rule_runs (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  rule_id uuid NOT NULL REFERENCES public.machine_connect_operational_rules(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.machine_connect_operational_events(id) ON DELETE CASCADE,
  correlation_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('matched','skipped','failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS machine_connect_operational_rule_runs_lookup_idx
  ON public.machine_connect_operational_rule_runs (organization_id, rule_id, created_at DESC);

ALTER TABLE public.machine_connect_operational_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_connect_operational_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_connect_operational_rule_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS machine_connect_operational_events_member_select ON public.machine_connect_operational_events;
CREATE POLICY machine_connect_operational_events_member_select ON public.machine_connect_operational_events
FOR SELECT USING (EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id = machine_connect_operational_events.organization_id AND m.user_id = auth.uid()));

DROP POLICY IF EXISTS machine_connect_operational_rules_member_all ON public.machine_connect_operational_rules;
CREATE POLICY machine_connect_operational_rules_member_all ON public.machine_connect_operational_rules
FOR ALL USING (EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id = machine_connect_operational_rules.organization_id AND m.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id = machine_connect_operational_rules.organization_id AND m.user_id = auth.uid()));

DROP POLICY IF EXISTS machine_connect_operational_rule_runs_member_select ON public.machine_connect_operational_rule_runs;
CREATE POLICY machine_connect_operational_rule_runs_member_select ON public.machine_connect_operational_rule_runs
FOR SELECT USING (EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id = machine_connect_operational_rule_runs.organization_id AND m.user_id = auth.uid()));
