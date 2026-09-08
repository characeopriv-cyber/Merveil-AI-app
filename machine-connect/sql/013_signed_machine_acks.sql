-- Machine Connect: public-key authenticated, replay-resistant machine ACKs.
-- Apply to the Machine Connect Supabase project before enabling signed ACKs.

ALTER TABLE public.machine_connect_credentials
  ADD COLUMN IF NOT EXISTS public_key_pem text;

CREATE TABLE IF NOT EXISTS public.machine_connect_ack_nonces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL,
  machine_id uuid NOT NULL,
  command_id uuid NOT NULL,
  nonce text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, machine_id, nonce)
);

CREATE INDEX IF NOT EXISTS machine_connect_ack_nonces_expiry_idx
  ON public.machine_connect_ack_nonces (expires_at);

ALTER TABLE public.machine_connect_ack_nonces ENABLE ROW LEVEL SECURITY;

-- Cleanup is intentionally server-side; the table has no client policies.
