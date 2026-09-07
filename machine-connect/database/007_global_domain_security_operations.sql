-- Machine Connect global-domain/security operations extensions.
-- Safe to re-run. Existing vulnerabilities table is extended instead of recreated.

ALTER TABLE public.vulnerabilities ADD COLUMN IF NOT EXISTS scan_id bigint REFERENCES public.vulnerability_scans(id) ON DELETE SET NULL;
ALTER TABLE public.vulnerabilities ADD COLUMN IF NOT EXISTS target text;
ALTER TABLE public.vulnerabilities ADD COLUMN IF NOT EXISTS affected_component text;
CREATE INDEX IF NOT EXISTS vulnerabilities_scan_idx ON public.vulnerabilities(scan_id);
CREATE INDEX IF NOT EXISTS vulnerabilities_target_idx ON public.vulnerabilities(organization_id, target);

CREATE TABLE IF NOT EXISTS public.security_remediation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  vulnerability_id bigint REFERENCES public.vulnerabilities(id) ON DELETE SET NULL,
  incident_id bigint REFERENCES public.incidents(id) ON DELETE SET NULL,
  target_id text NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('patch','rotate_credential','isolate','restore_configuration','restart_service','retest')),
  status text NOT NULL DEFAULT 'approval_required' CHECK (status IN ('requested','approval_required','approved','running','succeeded','failed','rejected','expired')),
  requested_by uuid NOT NULL REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  idempotency_key text NOT NULL,
  reason text NOT NULL,
  expires_at timestamptz NOT NULL,
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS security_remediation_org_status_idx ON public.security_remediation_jobs(organization_id, status, created_at DESC);
ALTER TABLE public.security_remediation_jobs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.security_retests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  remediation_id uuid NOT NULL REFERENCES public.security_remediation_jobs(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','running','passed','failed')),
  evidence jsonb,
  requested_by uuid REFERENCES auth.users(id),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS security_retests_org_idx ON public.security_retests(organization_id, created_at DESC);
ALTER TABLE public.security_retests ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.platform_security_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  service text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('authentication','authorization','rate_limit','integrity','dependency','configuration','availability','data_access')),
  severity text NOT NULL CHECK (severity IN ('info','low','medium','high','critical')),
  event_key text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  received_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS platform_security_events_org_time_idx ON public.platform_security_events(organization_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS platform_security_events_type_idx ON public.platform_security_events(event_type, occurred_at DESC);
ALTER TABLE public.platform_security_events ENABLE ROW LEVEL SECURITY;

-- Organization isolation: membership is evaluated through the existing organization_members table.
DROP POLICY IF EXISTS security_remediation_member_read ON public.security_remediation_jobs;
CREATE POLICY security_remediation_member_read ON public.security_remediation_jobs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id = security_remediation_jobs.organization_id AND m.user_id = auth.uid()));
DROP POLICY IF EXISTS security_retests_member_read ON public.security_retests;
CREATE POLICY security_retests_member_read ON public.security_retests FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id = security_retests.organization_id AND m.user_id = auth.uid()));
DROP POLICY IF EXISTS platform_security_events_member_read ON public.platform_security_events;
CREATE POLICY platform_security_events_member_read ON public.platform_security_events FOR SELECT TO authenticated USING (organization_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id = platform_security_events.organization_id AND m.user_id = auth.uid()));

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_security_events; EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;
END $$;
