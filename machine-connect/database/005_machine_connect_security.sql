-- Machine Connect Security Operations schema.
-- Apply after 004_machine_connect_hardening.sql.
-- Security services write through trusted backend paths; browser access is RLS protected.

CREATE TABLE IF NOT EXISTS public.security_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  device_id uuid REFERENCES public.devices(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  source text NOT NULL DEFAULT 'machine-connect',
  source_ip inet,
  destination_ip inet,
  event_key text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  received_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT security_events_severity_check CHECK (severity IN ('info','low','medium','high','critical'))
);
CREATE INDEX IF NOT EXISTS idx_security_events_org_time ON public.security_events(organization_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_device_time ON public.security_events(device_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events(event_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_security_events_event_key ON public.security_events(organization_id, event_key) WHERE event_key IS NOT NULL;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.threat_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  indicator text NOT NULL,
  type text NOT NULL,
  source text NOT NULL DEFAULT 'internal',
  confidence numeric(5,2),
  tags text[] NOT NULL DEFAULT '{}',
  first_seen timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true,
  CONSTRAINT threat_indicators_type_check CHECK (type IN ('ip','domain','hash','url','email','cidr')),
  CONSTRAINT threat_indicators_confidence_check CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 100))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_threat_indicators_org_indicator_type ON public.threat_indicators(organization_id, indicator, type);
CREATE INDEX IF NOT EXISTS idx_threat_indicators_indicator ON public.threat_indicators(indicator);
CREATE INDEX IF NOT EXISTS idx_threat_indicators_org_active ON public.threat_indicators(organization_id, active);
ALTER TABLE public.threat_indicators ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open',
  severity text NOT NULL DEFAULT 'medium',
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT incidents_status_check CHECK (status IN ('open','investigating','contained','resolved','closed')),
  CONSTRAINT incidents_severity_check CHECK (severity IN ('info','low','medium','high','critical'))
);
CREATE INDEX IF NOT EXISTS idx_incidents_org_status ON public.incidents(organization_id, status, updated_at DESC);
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.incident_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  evidence_type text NOT NULL,
  storage_path text,
  content_hash text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT incident_evidence_type_check CHECK (evidence_type IN ('file','log','screenshot','event','network_capture','other'))
);
CREATE INDEX IF NOT EXISTS idx_incident_evidence_incident ON public.incident_evidence(incident_id, created_at DESC);
ALTER TABLE public.incident_evidence ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.vulnerabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  device_id uuid REFERENCES public.devices(id) ON DELETE CASCADE,
  cve_id text,
  title text,
  description text,
  cvss_score numeric(4,1),
  remediation text,
  status text NOT NULL DEFAULT 'open',
  discovered_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CONSTRAINT vulnerabilities_status_check CHECK (status IN ('open','accepted','in_progress','resolved','false_positive')),
  CONSTRAINT vulnerabilities_cvss_check CHECK (cvss_score IS NULL OR (cvss_score >= 0 AND cvss_score <= 10))
);
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_org_status ON public.vulnerabilities(organization_id, status, discovered_at DESC);
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_device ON public.vulnerabilities(device_id, discovered_at DESC);
ALTER TABLE public.vulnerabilities ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.security_playbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  trigger jsonb NOT NULL DEFAULT '{}'::jsonb,
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  enabled boolean NOT NULL DEFAULT false,
  requires_approval boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_security_playbooks_org ON public.security_playbooks(organization_id, enabled);
ALTER TABLE public.security_playbooks ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  security_event_id bigint REFERENCES public.security_events(id) ON DELETE SET NULL,
  incident_id uuid REFERENCES public.incidents(id) ON DELETE SET NULL,
  alert_type text NOT NULL,
  severity text NOT NULL,
  title text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  acknowledged_at timestamptz,
  acknowledged_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT security_alerts_severity_check CHECK (severity IN ('info','low','medium','high','critical')),
  CONSTRAINT security_alerts_status_check CHECK (status IN ('open','acknowledged','resolved','dismissed'))
);
CREATE INDEX IF NOT EXISTS idx_security_alerts_org_status ON public.security_alerts(organization_id, status, created_at DESC);
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.machine_connect_security_member(p_org uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = p_org AND om.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.machine_connect_security_admin(p_org uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = p_org AND om.user_id = auth.uid() AND om.role = 'admin'
  );
$$;

DROP POLICY IF EXISTS security_events_member_select ON public.security_events;
CREATE POLICY security_events_member_select ON public.security_events FOR SELECT
USING (public.machine_connect_security_member(organization_id));

DROP POLICY IF EXISTS threat_indicators_member_select ON public.threat_indicators;
CREATE POLICY threat_indicators_member_select ON public.threat_indicators FOR SELECT
USING (public.machine_connect_security_member(organization_id));

DROP POLICY IF EXISTS incidents_member_select ON public.incidents;
CREATE POLICY incidents_member_select ON public.incidents FOR SELECT
USING (public.machine_connect_security_member(organization_id));

DROP POLICY IF EXISTS incidents_admin_manage ON public.incidents;
CREATE POLICY incidents_admin_manage ON public.incidents FOR ALL
USING (public.machine_connect_security_admin(organization_id))
WITH CHECK (public.machine_connect_security_admin(organization_id));

DROP POLICY IF EXISTS incident_evidence_member_select ON public.incident_evidence;
CREATE POLICY incident_evidence_member_select ON public.incident_evidence FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.incidents i
  WHERE i.id = incident_id AND public.machine_connect_security_member(i.organization_id)
));

DROP POLICY IF EXISTS vulnerabilities_member_select ON public.vulnerabilities;
CREATE POLICY vulnerabilities_member_select ON public.vulnerabilities FOR SELECT
USING (public.machine_connect_security_member(organization_id));

DROP POLICY IF EXISTS vulnerabilities_admin_manage ON public.vulnerabilities;
CREATE POLICY vulnerabilities_admin_manage ON public.vulnerabilities FOR ALL
USING (public.machine_connect_security_admin(organization_id))
WITH CHECK (public.machine_connect_security_admin(organization_id));

DROP POLICY IF EXISTS security_playbooks_admin_manage ON public.security_playbooks;
CREATE POLICY security_playbooks_admin_manage ON public.security_playbooks FOR ALL
USING (public.machine_connect_security_admin(organization_id))
WITH CHECK (public.machine_connect_security_admin(organization_id));

DROP POLICY IF EXISTS security_alerts_member_select ON public.security_alerts;
CREATE POLICY security_alerts_member_select ON public.security_alerts FOR SELECT
USING (public.machine_connect_security_member(organization_id));

DROP POLICY IF EXISTS security_alerts_admin_manage ON public.security_alerts;
CREATE POLICY security_alerts_admin_manage ON public.security_alerts FOR UPDATE
USING (public.machine_connect_security_admin(organization_id))
WITH CHECK (public.machine_connect_security_admin(organization_id));

DROP TRIGGER IF EXISTS incidents_touch_updated_at ON public.incidents;
CREATE TRIGGER incidents_touch_updated_at BEFORE UPDATE ON public.incidents
FOR EACH ROW EXECUTE FUNCTION public.machine_connect_touch_updated_at();

DROP TRIGGER IF EXISTS security_playbooks_touch_updated_at ON public.security_playbooks;
CREATE TRIGGER security_playbooks_touch_updated_at BEFORE UPDATE ON public.security_playbooks
FOR EACH ROW EXECUTE FUNCTION public.machine_connect_touch_updated_at();

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.security_events;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.security_alerts;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
