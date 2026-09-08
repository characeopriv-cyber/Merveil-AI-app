-- Scoped API-key permissions. Secrets remain hashed; scopes are explicit capabilities.
ALTER TABLE public.machine_connect_api_keys
  ADD COLUMN IF NOT EXISTS scopes jsonb NOT NULL DEFAULT '["ontology.read"]'::jsonb;

ALTER TABLE public.machine_connect_api_keys
  DROP CONSTRAINT IF EXISTS machine_connect_api_keys_scopes_object;
ALTER TABLE public.machine_connect_api_keys
  ADD CONSTRAINT machine_connect_api_keys_scopes_object
  CHECK (jsonb_typeof(scopes) = 'array');

CREATE INDEX IF NOT EXISTS idx_mc_api_keys_org_enabled
  ON public.machine_connect_api_keys(organization_id, enabled);

CREATE TABLE IF NOT EXISTS public.machine_connect_api_key_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  api_key_id uuid NOT NULL REFERENCES public.machine_connect_api_keys(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('created','used','revoked','rotated','rate_limited')),
  request_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mc_api_key_events_org_time
  ON public.machine_connect_api_key_events(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mc_api_key_events_key_time
  ON public.machine_connect_api_key_events(api_key_id, created_at DESC);

ALTER TABLE public.machine_connect_api_key_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mc_api_key_events_select_member ON public.machine_connect_api_key_events;
CREATE POLICY mc_api_key_events_select_member ON public.machine_connect_api_key_events
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = machine_connect_api_key_events.organization_id
      AND om.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS mc_api_key_events_insert_owner_admin ON public.machine_connect_api_key_events;
CREATE POLICY mc_api_key_events_insert_owner_admin ON public.machine_connect_api_key_events
  FOR INSERT TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = machine_connect_api_key_events.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner','admin')
  ));
