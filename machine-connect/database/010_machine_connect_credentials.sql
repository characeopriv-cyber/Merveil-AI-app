-- Machine Connect credential hardening
-- Raw credentials are never stored; only salted scrypt hashes are persisted.

create table if not exists public.machine_connect_credentials (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  machine_id uuid not null,
  secret_hash text not null,
  secret_salt text not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz null
);

create index if not exists machine_connect_credentials_machine_idx
  on public.machine_connect_credentials (organization_id, machine_id, created_at desc);

create index if not exists machine_connect_credentials_active_idx
  on public.machine_connect_credentials (organization_id, machine_id)
  where revoked_at is null;

alter table public.machine_connect_credentials enable row level security;
