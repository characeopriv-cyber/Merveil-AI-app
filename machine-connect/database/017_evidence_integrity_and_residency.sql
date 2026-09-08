-- Machine Connect: compliance evidence integrity + organization residency policy.
-- Additive migration; does not alter the existing compliance evidence payload schema.

CREATE TABLE IF NOT EXISTS public.compliance_evidence_integrity (
  evidence_id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  content_sha256 text NOT NULL CHECK (content_sha256 ~ '^[0-9a-f]{64}$'),
  previous_hash text CHECK (previous_hash IS NULL OR previous_hash ~ '^[0-9a-f]{64}$'),
  chain_hash text NOT NULL CHECK (chain_hash ~ '^[0-9a-f]{64}$'),
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_compliance_evidence_integrity_org ON public.compliance_evidence_integrity(organization_id, recorded_at DESC);
ALTER TABLE public.compliance_evidence_integrity ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS compliance_evidence_integrity_select_member ON public.compliance_evidence_integrity;
CREATE POLICY compliance_evidence_integrity_select_member ON public.compliance_evidence_integrity
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = compliance_evidence_integrity.organization_id AND om.user_id = auth.uid()
  ));
DROP POLICY IF EXISTS compliance_evidence_integrity_manage_owner_admin ON public.compliance_evidence_integrity;
CREATE POLICY compliance_evidence_integrity_manage_owner_admin ON public.compliance_evidence_integrity
  FOR ALL TO authenticated USING (EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = compliance_evidence_integrity.organization_id AND om.user_id = auth.uid() AND om.role IN ('owner','admin')
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = compliance_evidence_integrity.organization_id AND om.user_id = auth.uid() AND om.role IN ('owner','admin')
  ));

CREATE TABLE IF NOT EXISTS public.machine_connect_data_residency_policies (
  organization_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  allowed_regions text[] NOT NULL DEFAULT '{}',
  default_region text,
  processing_restricted boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mc_residency_default_region ON public.machine_connect_data_residency_policies(default_region);
ALTER TABLE public.machine_connect_data_residency_policies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mc_residency_select_member ON public.machine_connect_data_residency_policies;
CREATE POLICY mc_residency_select_member ON public.machine_connect_data_residency_policies
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = machine_connect_data_residency_policies.organization_id AND om.user_id = auth.uid()
  ));
DROP POLICY IF EXISTS mc_residency_manage_owner_admin ON public.machine_connect_data_residency_policies;
CREATE POLICY mc_residency_manage_owner_admin ON public.machine_connect_data_residency_policies
  FOR ALL TO authenticated USING (EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = machine_connect_data_residency_policies.organization_id AND om.user_id = auth.uid() AND om.role IN ('owner','admin')
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = machine_connect_data_residency_policies.organization_id AND om.user_id = auth.uid() AND om.role IN ('owner','admin')
  ));
