-- Machine Connect enterprise API/security persistence.
-- Runtime-only secrets stay outside the database.

create table if not exists public.machine_connect_rate_limit_buckets (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  bucket_key text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (organization_id, bucket_key, window_started_at)
);

create index if not exists idx_mc_rate_limit_updated
  on public.machine_connect_rate_limit_buckets(updated_at);

alter table public.machine_connect_rate_limit_buckets enable row level security;
revoke all on public.machine_connect_rate_limit_buckets from anon, authenticated;
grant select,insert,update,delete on public.machine_connect_rate_limit_buckets to service_role;

create table if not exists public.machine_connect_security_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  actor_id text,
  event_type text not null check (event_type in (
    'auth_success','auth_failure','permission_denied','rate_limited',
    'api_key_created','api_key_revoked','credential_rotated','suspicious_request'
  )),
  request_id text,
  trace_id text,
  source_ip inet,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_mc_security_events_org_time
  on public.machine_connect_security_events(organization_id, created_at desc);
create index if not exists idx_mc_security_events_request
  on public.machine_connect_security_events(request_id);
create index if not exists idx_mc_security_events_type
  on public.machine_connect_security_events(event_type, created_at desc);

alter table public.machine_connect_security_events enable row level security;
revoke all on public.machine_connect_security_events from anon, authenticated;
grant select,insert on public.machine_connect_security_events to service_role;

create table if not exists public.machine_connect_backup_restore_runs (
  id uuid primary key default gen_random_uuid(),
  operation text not null check (operation in ('backup','restore','restore_test')),
  environment text not null default 'production',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'running' check (status in ('running','completed','failed')),
  artifact_ref text,
  verification_sha256 text check (verification_sha256 is null or verification_sha256 ~ '^[0-9a-fA-F]{64}$'),
  notes text,
  error_message text
);

create index if not exists idx_mc_backup_runs_time
  on public.machine_connect_backup_restore_runs(started_at desc);

alter table public.machine_connect_backup_restore_runs enable row level security;
revoke all on public.machine_connect_backup_restore_runs from anon, authenticated;
grant select,insert,update on public.machine_connect_backup_restore_runs to service_role;

create or replace function public.machine_connect_rate_limit_allow(
  p_org_id uuid,
  p_bucket_key text,
  p_limit integer,
  p_window_seconds integer default 60
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_start timestamptz;
  v_count integer;
begin
  if p_org_id is null or p_bucket_key is null or p_limit < 1
     or p_window_seconds < 1 or p_window_seconds > 3600 then
    return false;
  end if;

  v_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.machine_connect_rate_limit_buckets(
    organization_id, bucket_key, window_started_at, request_count, updated_at
  ) values (p_org_id, p_bucket_key, v_start, 1, now())
  on conflict (organization_id, bucket_key, window_started_at)
  do update set
    request_count = public.machine_connect_rate_limit_buckets.request_count + 1,
    updated_at = now()
  returning request_count into v_count;

  return v_count <= p_limit;
end;
$$;

revoke all on function public.machine_connect_rate_limit_allow(uuid,text,integer,integer)
  from public, anon, authenticated;
grant execute on function public.machine_connect_rate_limit_allow(uuid,text,integer,integer)
  to service_role;
