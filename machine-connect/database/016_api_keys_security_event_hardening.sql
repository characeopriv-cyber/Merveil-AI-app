-- Machine Connect API-key persistence and security-event compatibility.
-- Secrets are never stored in plaintext.

create table if not exists public.machine_connect_api_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  key_prefix text not null,
  secret_hash text not null check (secret_hash ~ '^[0-9a-f]{64}$'),
  created_by uuid not null references auth.users(id),
  enabled boolean not null default true,
  expires_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create unique index if not exists idx_mc_api_keys_secret_hash
  on public.machine_connect_api_keys(secret_hash);
create index if not exists idx_mc_api_keys_org_active
  on public.machine_connect_api_keys(organization_id, enabled, created_at desc);
create index if not exists idx_mc_api_keys_expiry
  on public.machine_connect_api_keys(expires_at)
  where expires_at is not null;

alter table public.machine_connect_api_keys enable row level security;
revoke all on public.machine_connect_api_keys from anon, authenticated;
grant select, insert, update on public.machine_connect_api_keys to service_role;

-- Keep the security-event ledger compatible with the richer Core event contract.
alter table public.machine_connect_security_events
  add column if not exists severity text not null default 'info',
  add column if not exists resource_type text,
  add column if not exists resource_id text;

alter table public.machine_connect_security_events
  drop constraint if exists machine_connect_security_events_event_type_check;

alter table public.machine_connect_security_events
  add constraint machine_connect_security_events_event_type_check
  check (event_type in (
    'auth_success','auth_failure','permission_denied','rate_limited',
    'api_key.created','api_key.used','api_key.revoked','api_key.rotated',
    'credential_issued','credential_revoked','credential_rotated',
    'rate_limit.exceeded','command.requested','command.rejected',
    'command.dispatched','command.transitioned','suspicious_request'
  ));

alter table public.machine_connect_security_events
  add constraint machine_connect_security_events_severity_check
  check (severity in ('debug','info','warn','error','critical'));

create index if not exists idx_mc_security_events_resource
  on public.machine_connect_security_events(resource_type, resource_id, created_at desc);
