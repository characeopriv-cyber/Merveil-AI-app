-- Machine Connect data lifecycle controls.
-- Policies default to disabled until an enterprise retention profile is explicitly activated.
create table if not exists public.machine_connect_retention_policies (
  table_name text primary key,
  timestamp_column text not null,
  retention_days integer not null check (retention_days >= 1),
  archive_after_days integer check (archive_after_days is null or archive_after_days >= retention_days),
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.machine_connect_legal_holds (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id text not null,
  reason text not null check (char_length(reason) between 1 and 2000),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  released_at timestamptz
);

create unique index if not exists idx_mc_legal_holds_active on public.machine_connect_legal_holds(table_name, record_id) where released_at is null;
create index if not exists idx_mc_retention_enabled on public.machine_connect_retention_policies(enabled) where enabled;

alter table public.machine_connect_retention_policies enable row level security;
alter table public.machine_connect_legal_holds enable row level security;

-- Runtime applies these policies with service-role execution only; authenticated users can read policy state
-- and manage their own legal-hold records through the application authorization layer.

drop policy if exists mc_retention_select on public.machine_connect_retention_policies;
create policy mc_retention_select on public.machine_connect_retention_policies for select to authenticated using (exists (select 1 from public.organization_members om where om.user_id = auth.uid()));

drop policy if exists mc_legal_holds_select on public.machine_connect_legal_holds;
create policy mc_legal_holds_select on public.machine_connect_legal_holds for select to authenticated using (created_by = auth.uid());

drop policy if exists mc_legal_holds_insert on public.machine_connect_legal_holds;
create policy mc_legal_holds_insert on public.machine_connect_legal_holds for insert to authenticated with check (created_by = auth.uid());

insert into public.machine_connect_retention_policies(table_name,timestamp_column,retention_days,archive_after_days,enabled) values
 ('device_telemetry','observed_at',30,null,false),
 ('machine_connect_telemetry','observed_at',30,null,false),
 ('api_usage_logs','created_at',90,null,false),
 ('audit_logs','created_at',3650,null,false),
 ('admin_audit_log','created_at',3650,null,false),
 ('michael_audit','created_at',3650,null,false)
on conflict (table_name) do nothing;

create or replace function public.machine_connect_apply_retention()
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  p record;
  deleted_count integer := 0;
  n integer;
begin
  for p in select * from public.machine_connect_retention_policies where enabled loop
    if p.table_name not in ('device_telemetry','machine_connect_telemetry','api_usage_logs','audit_logs','admin_audit_log','michael_audit') then
      continue;
    end if;
    execute format('delete from public.%I t where t.%I < now() - make_interval(days => $1) and not exists (select 1 from public.machine_connect_legal_holds h where h.table_name = $2 and h.record_id = t.id::text and h.released_at is null)', p.table_name, p.timestamp_column)
      using p.retention_days, p.table_name;
    get diagnostics n = row_count;
    deleted_count := deleted_count + n;
  end loop;
  return deleted_count;
end;
$$;

revoke all on function public.machine_connect_apply_retention() from public, anon, authenticated;
grant execute on function public.machine_connect_apply_retention() to service_role;

-- If pg_cron is enabled in the project, schedule the daily cleanup.
DO $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('machine-connect-retention-daily','15 2 * * *','select public.machine_connect_apply_retention()');
  end if;
exception when duplicate_object then null;
end $$;
