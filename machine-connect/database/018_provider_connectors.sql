-- Machine Connect provider connector registry.
-- Applied to Supabase as machine_connect_provider_connectors_v1.
-- Secrets are referenced by secret_ref only; plaintext credentials never belong here.

CREATE TABLE IF NOT EXISTS public.machine_connect_connector_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  provider text NOT NULL CHECK (provider ~ '^[a-z0-9][a-z0-9._-]{1,79}$'),
  protocol text NOT NULL DEFAULT 'https' CHECK (protocol IN ('https','mqtt','websocket','tcp','udp','modbus','opcua','custom')),
  status text NOT NULL DEFAULT 'disabled' CHECK (status IN ('disabled','pending','active','error','revoked')),
  endpoint text,
  auth_mode text NOT NULL DEFAULT 'managed' CHECK (auth_mode IN ('managed','api_key','oauth2','mtls','machine_credential','none')),
  secret_ref text,
  capabilities jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(capabilities) = 'array'),
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(configuration) = 'object'),
  last_error text,
  last_connected_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mc_connector_org ON public.machine_connect_connector_instances(organization_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_mc_connector_provider ON public.machine_connect_connector_instances(provider, status);

CREATE TABLE IF NOT EXISTS public.machine_connect_connector_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  connector_id uuid NOT NULL REFERENCES public.machine_connect_connector_instances(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('created','enabled','disabled','connected','disconnected','failed','rotated','revoked')),
  actor_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mc_connector_events_org_created ON public.machine_connect_connector_events(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mc_connector_events_connector ON public.machine_connect_connector_events(connector_id, created_at DESC);
