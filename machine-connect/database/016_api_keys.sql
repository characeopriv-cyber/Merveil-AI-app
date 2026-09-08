-- Machine Connect API keys: store only SHA-256 secret hashes.
CREATE TABLE IF NOT EXISTS public.machine_connect_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 120),
  key_prefix text NOT NULL,
  secret_hash text NOT NULL UNIQUE,
  created_by uuid NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mc_api_keys_org ON public.machine_connect_api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_mc_api_keys_active ON public.machine_connect_api_keys(secret_hash) WHERE enabled = true;

ALTER TABLE public.machine_connect_api_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mc_api_keys_select_member ON public.machine_connect_api_keys;
DROP POLICY IF EXISTS mc_api_keys_manage_owner_admin ON public.machine_connect_api_keys;

CREATE POLICY mc_api_keys_select_member ON public.machine_connect_api_keys
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = machine_connect_api_keys.organization_id
      AND om.user_id = auth.uid()
  ));

CREATE POLICY mc_api_keys_manage_owner_admin ON public.machine_connect_api_keys
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = machine_connect_api_keys.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner','admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = machine_connect_api_keys.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner','admin')
  ));
