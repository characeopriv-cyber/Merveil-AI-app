-- CHRYSALIS (CHR-016) — legacy machine modernization.
-- Uses the canonical Machine Connect registry; does not create a second device registry.
-- Physical installation is never simulated. An upgrade becomes active only after explicit verification.

CREATE TABLE IF NOT EXISTS public.machine_connect_capability_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capability_key text NOT NULL UNIQUE,
  category text NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT machine_connect_capability_category_check CHECK (category IN ('connectivity','processing','interface','security','intelligence','control'))
);

CREATE TABLE IF NOT EXISTS public.machine_connect_legacy_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  machine_id uuid NOT NULL REFERENCES public.machine_connect_machines(id) ON DELETE CASCADE,
  manufacturer text,
  model text,
  year_manufactured integer,
  current_capabilities text[] NOT NULL DEFAULT '{}',
  desired_capabilities text[] NOT NULL DEFAULT '{}',
  missing_capabilities text[] NOT NULL DEFAULT '{}',
  assessment_status text NOT NULL DEFAULT 'completed',
  assessment_date timestamptz NOT NULL DEFAULT now(),
  assessed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT machine_connect_legacy_assessment_year_check CHECK (year_manufactured IS NULL OR (year_manufactured >= 1800 AND year_manufactured <= 3000)),
  CONSTRAINT machine_connect_legacy_assessment_status_check CHECK (assessment_status IN ('draft','completed','superseded'))
);
CREATE INDEX IF NOT EXISTS idx_mc_legacy_assessments_org_time ON public.machine_connect_legacy_assessments(organization_id, assessment_date DESC);
CREATE INDEX IF NOT EXISTS idx_mc_legacy_assessments_machine ON public.machine_connect_legacy_assessments(machine_id, assessment_date DESC);

CREATE TABLE IF NOT EXISTS public.machine_connect_upgrade_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.machine_connect_legacy_assessments(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  strategy text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  required_parts text[] NOT NULL DEFAULT '{}',
  complexity text NOT NULL DEFAULT 'medium',
  estimated_cost numeric,
  estimated_time_interval interval,
  instructions jsonb NOT NULL DEFAULT '[]'::jsonb,
  constraints jsonb NOT NULL DEFAULT '{}'::jsonb,
  safety_class text NOT NULL DEFAULT 'control',
  recommendation_confidence numeric(5,4),
  status text NOT NULL DEFAULT 'recommended',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT machine_connect_upgrade_strategy_check CHECK (strategy IN ('hardware_addon','firmware_flash','software_emulation','hybrid','replacement')),
  CONSTRAINT machine_connect_upgrade_complexity_check CHECK (complexity IN ('low','medium','high','unknown')),
  CONSTRAINT machine_connect_upgrade_safety_check CHECK (safety_class IN ('read','control','critical')),
  CONSTRAINT machine_connect_upgrade_confidence_check CHECK (recommendation_confidence IS NULL OR (recommendation_confidence >= 0 AND recommendation_confidence <= 1)),
  CONSTRAINT machine_connect_upgrade_status_check CHECK (status IN ('recommended','selected','superseded','not_compatible')),
  CONSTRAINT machine_connect_upgrade_cost_check CHECK (estimated_cost IS NULL OR estimated_cost >= 0)
);
CREATE INDEX IF NOT EXISTS idx_mc_upgrade_paths_assessment ON public.machine_connect_upgrade_paths(assessment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mc_upgrade_paths_org ON public.machine_connect_upgrade_paths(organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.machine_connect_installed_upgrades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upgrade_path_id uuid NOT NULL REFERENCES public.machine_connect_upgrade_paths(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  machine_id uuid NOT NULL REFERENCES public.machine_connect_machines(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'awaiting_installation',
  installed_at timestamptz,
  installed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  verification_status text NOT NULL DEFAULT 'pending',
  verified_at timestamptz,
  verified_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  resulting_capabilities text[] NOT NULL DEFAULT '{}',
  adapter_recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT machine_connect_installed_upgrade_status_check CHECK (status IN ('awaiting_installation','installing','installed','failed','cancelled')),
  CONSTRAINT machine_connect_installed_upgrade_verification_check CHECK (verification_status IN ('pending','passed','failed'))
);
CREATE INDEX IF NOT EXISTS idx_mc_installed_upgrades_org ON public.machine_connect_installed_upgrades(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mc_installed_upgrades_machine ON public.machine_connect_installed_upgrades(machine_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.machine_connect_compatibility_matrix (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  manufacturer_pattern text,
  model_pattern text,
  capability_needed text NOT NULL REFERENCES public.machine_connect_capability_catalog(capability_key),
  strategy text NOT NULL,
  recommended_upgrade text NOT NULL,
  constraints jsonb NOT NULL DEFAULT '{}'::jsonb,
  verified boolean NOT NULL DEFAULT false,
  source_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT machine_connect_compatibility_strategy_check CHECK (strategy IN ('hardware_addon','firmware_flash','software_emulation','hybrid','replacement'))
);
CREATE INDEX IF NOT EXISTS idx_mc_compatibility_capability ON public.machine_connect_compatibility_matrix(capability_needed, verified);
CREATE INDEX IF NOT EXISTS idx_mc_compatibility_model ON public.machine_connect_compatibility_matrix(manufacturer_pattern, model_pattern);

INSERT INTO public.machine_connect_capability_catalog (capability_key, category, description) VALUES
  ('wifi','connectivity','Wi-Fi network connectivity'),
  ('bluetooth','connectivity','Bluetooth connectivity'),
  ('mqtt','connectivity','MQTT telemetry/command transport'),
  ('http','connectivity','HTTP API connectivity'),
  ('4k_video','interface','4K video output or processing'),
  ('smart_tv','processing','Modern smart-TV application environment'),
  ('voice_control','intelligence','Voice-command interface'),
  ('edge_processing','processing','Local edge compute capability'),
  ('modern_security','security','Modern authentication and secure transport'),
  ('telemetry','intelligence','Machine telemetry exposure'),
  ('remote_control','control','Authorized remote control capability'),
  ('protocol_bridge','connectivity','Protocol translation through a gateway'),
  ('firmware_update','processing','Supported firmware update path'),
  ('usb_host','interface','USB host interface'),
  ('hdmi_input','interface','HDMI input interface')
ON CONFLICT (capability_key) DO NOTHING;

-- Generic, vendor-neutral starting templates. Exact compatibility must be verified for the specific model.
INSERT INTO public.machine_connect_compatibility_matrix
  (manufacturer_pattern, model_pattern, capability_needed, strategy, recommended_upgrade, constraints, verified, source_reference)
VALUES
  ('%','%', 'wifi', 'hardware_addon', 'Compatible external network gateway', '{"requires":"available_interface_and_power"}', false, 'template'),
  ('%','%', 'smart_tv', 'hardware_addon', 'Compatible external smart-TV/streaming gateway', '{"requires":"compatible_video_input_and_power"}', false, 'template'),
  ('%','%', 'voice_control', 'hardware_addon', 'Compatible voice-enabled gateway', '{"requires":"supported_gateway_and_network"}', false, 'template'),
  ('%','%', 'mqtt', 'software_emulation', 'Edge protocol bridge', '{"requires":"accessible_local_interface"}', false, 'template'),
  ('%','%', 'protocol_bridge', 'software_emulation', 'PULSE Edge protocol gateway', '{"requires":"documented_or_observable_protocol"}', false, 'template')
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.machine_connect_chrysalis_member(p_org uuid)
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

CREATE OR REPLACE FUNCTION public.machine_connect_chrysalis_admin(p_org uuid)
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

ALTER TABLE public.machine_connect_capability_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_connect_legacy_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_connect_upgrade_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_connect_installed_upgrades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_connect_compatibility_matrix ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mc_capability_catalog_member_select ON public.machine_connect_capability_catalog;
CREATE POLICY mc_capability_catalog_member_select ON public.machine_connect_capability_catalog FOR SELECT
USING (active AND EXISTS (SELECT 1 FROM public.organization_members om WHERE om.user_id = auth.uid()));

DROP POLICY IF EXISTS mc_legacy_assessments_member_select ON public.machine_connect_legacy_assessments;
CREATE POLICY mc_legacy_assessments_member_select ON public.machine_connect_legacy_assessments FOR SELECT
USING (public.machine_connect_chrysalis_member(organization_id));
DROP POLICY IF EXISTS mc_legacy_assessments_admin_manage ON public.machine_connect_legacy_assessments;
CREATE POLICY mc_legacy_assessments_admin_manage ON public.machine_connect_legacy_assessments FOR ALL
USING (public.machine_connect_chrysalis_admin(organization_id))
WITH CHECK (public.machine_connect_chrysalis_admin(organization_id));

DROP POLICY IF EXISTS mc_upgrade_paths_member_select ON public.machine_connect_upgrade_paths;
CREATE POLICY mc_upgrade_paths_member_select ON public.machine_connect_upgrade_paths FOR SELECT
USING (public.machine_connect_chrysalis_member(organization_id));
DROP POLICY IF EXISTS mc_upgrade_paths_admin_manage ON public.machine_connect_upgrade_paths;
CREATE POLICY mc_upgrade_paths_admin_manage ON public.machine_connect_upgrade_paths FOR ALL
USING (public.machine_connect_chrysalis_admin(organization_id))
WITH CHECK (public.machine_connect_chrysalis_admin(organization_id));

DROP POLICY IF EXISTS mc_installed_upgrades_member_select ON public.machine_connect_installed_upgrades;
CREATE POLICY mc_installed_upgrades_member_select ON public.machine_connect_installed_upgrades FOR SELECT
USING (public.machine_connect_chrysalis_member(organization_id));
DROP POLICY IF EXISTS mc_installed_upgrades_admin_manage ON public.machine_connect_installed_upgrades;
CREATE POLICY mc_installed_upgrades_admin_manage ON public.machine_connect_installed_upgrades FOR ALL
USING (public.machine_connect_chrysalis_admin(organization_id))
WITH CHECK (public.machine_connect_chrysalis_admin(organization_id));

DROP POLICY IF EXISTS mc_compatibility_member_select ON public.machine_connect_compatibility_matrix;
CREATE POLICY mc_compatibility_member_select ON public.machine_connect_compatibility_matrix FOR SELECT
USING (organization_id IS NULL OR public.machine_connect_chrysalis_member(organization_id));
DROP POLICY IF EXISTS mc_compatibility_admin_manage ON public.machine_connect_compatibility_matrix;
CREATE POLICY mc_compatibility_admin_manage ON public.machine_connect_compatibility_matrix FOR ALL
USING (organization_id IS NULL OR public.machine_connect_chrysalis_admin(organization_id))
WITH CHECK (organization_id IS NULL OR public.machine_connect_chrysalis_admin(organization_id));

-- Backend uses the service-role key and remains the authorization boundary for these workflows.
