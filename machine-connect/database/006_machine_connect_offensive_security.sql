-- Offensive security control-plane persistence.
-- This migration records authorized scan jobs and findings; execution remains isolated from the API.

CREATE TABLE IF NOT EXISTS public.vulnerability_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  scan_name text NOT NULL,
  target text NOT NULL,
  scan_type text NOT NULL,
  tool_used text,
  mode text NOT NULL DEFAULT 'discovery',
  status text NOT NULL DEFAULT 'running',
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT vulnerability_scans_type_check CHECK (scan_type IN ('network','web','api','cloud')),
  CONSTRAINT vulnerability_scans_mode_check CHECK (mode IN ('discovery','assessment','validation')),
  CONSTRAINT vulnerability_scans_status_check CHECK (status IN ('requested','approved','running','completed','failed','cancelled'))
);
CREATE INDEX IF NOT EXISTS idx_vulnerability_scans_org_time ON public.vulnerability_scans(organization_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_vulnerability_scans_org_status ON public.vulnerability_scans(organization_id, status);
ALTER TABLE public.vulnerability_scans ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.exploitation_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  vulnerability_id uuid REFERENCES public.vulnerabilities(id) ON DELETE CASCADE,
  attempt_time timestamptz NOT NULL DEFAULT now(),
  technique_id text,
  mode text NOT NULL DEFAULT 'validation',
  authorized_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'requested',
  success boolean NOT NULL DEFAULT false,
  evidence_path text,
  impact text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT exploitation_attempts_mode_check CHECK (mode IN ('validation','emulation')),
  CONSTRAINT exploitation_attempts_status_check CHECK (status IN ('requested','approved','running','completed','failed','cancelled'))
);
CREATE INDEX IF NOT EXISTS idx_exploitation_attempts_org_time ON public.exploitation_attempts(organization_id, attempt_time DESC);
CREATE INDEX IF NOT EXISTS idx_exploitation_attempts_vulnerability ON public.exploitation_attempts(vulnerability_id);
ALTER TABLE public.exploitation_attempts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.red_team_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'planned',
  objectives text[] NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT red_team_campaigns_status_check CHECK (status IN ('planned','approved','running','paused','completed','cancelled'))
);
CREATE INDEX IF NOT EXISTS idx_red_team_campaigns_org_status ON public.red_team_campaigns(organization_id, status, created_at DESC);
ALTER TABLE public.red_team_campaigns ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.red_team_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.red_team_campaigns(id) ON DELETE CASCADE,
  finding_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  reported_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT red_team_findings_severity_check CHECK (severity IN ('info','low','medium','high','critical'))
);
CREATE INDEX IF NOT EXISTS idx_red_team_findings_campaign ON public.red_team_findings(campaign_id, reported_at DESC);
ALTER TABLE public.red_team_findings ENABLE ROW LEVEL SECURITY;

-- Members may read assessment records; administrative mutation remains server-side.
DROP POLICY IF EXISTS vulnerability_scans_member_select ON public.vulnerability_scans;
CREATE POLICY vulnerability_scans_member_select ON public.vulnerability_scans FOR SELECT
USING (public.machine_connect_security_member(organization_id));

DROP POLICY IF EXISTS exploitation_attempts_member_select ON public.exploitation_attempts;
CREATE POLICY exploitation_attempts_member_select ON public.exploitation_attempts FOR SELECT
USING (public.machine_connect_security_member(organization_id));

DROP POLICY IF EXISTS red_team_campaigns_member_select ON public.red_team_campaigns;
CREATE POLICY red_team_campaigns_member_select ON public.red_team_campaigns FOR SELECT
USING (public.machine_connect_security_member(organization_id));

DROP POLICY IF EXISTS red_team_findings_member_select ON public.red_team_findings;
CREATE POLICY red_team_findings_member_select ON public.red_team_findings FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.red_team_campaigns c
  WHERE c.id = campaign_id AND public.machine_connect_security_member(c.organization_id)
));
