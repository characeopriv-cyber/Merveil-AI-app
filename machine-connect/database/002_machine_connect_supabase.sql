-- Merveil Machine Connect — Supabase production schema
-- Branch: feature/machine-connect
--
-- Design notes:
-- * Uses auth.users directly; Merveil's existing profile system remains the user-profile source of truth.
-- * Organization membership is the tenant boundary.
-- * Backend/device ingestion uses service_role; browser clients use authenticated + RLS.
-- * Authorization helpers live in private schema to avoid recursive RLS policies.
-- * No device secret, broker password, API key, or service_role key is stored here.
-- * Safety/approval decisions remain in Machine Connect Core; the database is the durable system of record.

create extension if not exists pgcrypto;

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- Tenant model
-- ---------------------------------------------------------------------------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 200),
  plan text not null default 'free' check (plan in ('free','pro','enterprise','internal')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('admin','operator','viewer','member')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index if not exists organization_members_user_idx
  on public.organization_members(user_id, organization_id);

-- ---------------------------------------------------------------------------
-- Devices registry
-- ---------------------------------------------------------------------------
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  device_id text not null,
  name text not null,
  type text not null,
  protocol text not null default 'mqtt',
  adapter_id text,
  capabilities jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'offline'
    check (status in ('online','offline','connecting','idle','active','warning','critical','maintenance','locked','emergency_stop')),
  trust_level text not null default 'unknown'
    check (trust_level in ('unknown','untrusted','trusted','verified')),
  last_seen timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, device_id)
);

create index if not exists devices_org_idx on public.devices(organization_id);
create index if not exists devices_org_status_idx on public.devices(organization_id, status);
create index if not exists devices_type_idx on public.devices(type);

-- ---------------------------------------------------------------------------
-- Telemetry — append-oriented, idempotent ingestion
-- ---------------------------------------------------------------------------
create table if not exists public.device_telemetry (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  device_id uuid not null references public.devices(id) on delete cascade,
  source text not null default 'unknown',
  schema_version text not null default '1',
  sequence bigint,
  observed_at timestamptz not null default now(),
  received_at timestamptz not null default now(),
  quality text not null default 'unknown'
    check (quality in ('unknown','good','degraded','bad')),
  data jsonb not null,
  temperature numeric,
  humidity numeric,
  battery numeric,
  unique (organization_id, device_id, source, sequence)
);

create index if not exists device_telemetry_device_time_idx
  on public.device_telemetry(device_id, observed_at desc);
create index if not exists device_telemetry_org_time_idx
  on public.device_telemetry(organization_id, observed_at desc);
create index if not exists device_telemetry_source_time_idx
  on public.device_telemetry(source, observed_at desc);

-- ---------------------------------------------------------------------------
-- Commands — durable command lifecycle + idempotency
-- ---------------------------------------------------------------------------
create table if not exists public.device_commands (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  device_id uuid not null references public.devices(id) on delete cascade,
  idempotency_key text not null,
  command jsonb not null,
  status text not null default 'requested'
    check (status in ('requested','authorized','approval_required','approved','dispatched','acknowledged','rejected','timed_out','failed','cancelled','emergency_stopped')),
  requested_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  rejection_reason text,
  requested_at timestamptz not null default now(),
  dispatched_at timestamptz,
  acknowledged_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, idempotency_key)
);

create index if not exists device_commands_device_time_idx
  on public.device_commands(device_id, created_at desc);
create index if not exists device_commands_org_status_idx
  on public.device_commands(organization_id, status, created_at desc);

-- ---------------------------------------------------------------------------
-- Automation rules
-- ---------------------------------------------------------------------------
create table if not exists public.rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  trigger_type text not null check (trigger_type in ('telemetry','schedule','event')),
  trigger_config jsonb not null default '{}'::jsonb,
  condition jsonb not null default '{}'::jsonb,
  action jsonb not null,
  enabled boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rules_org_idx on public.rules(organization_id);
create index if not exists rules_enabled_idx on public.rules(organization_id, enabled);

-- ---------------------------------------------------------------------------
-- Webhooks — store a reference to a secret, not the secret itself
-- ---------------------------------------------------------------------------
create table if not exists public.webhooks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  url text not null check (url ~ '^https://'),
  event_type text not null,
  secret_ref text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists webhooks_org_idx on public.webhooks(organization_id);
create index if not exists webhooks_active_idx on public.webhooks(organization_id, active);

-- ---------------------------------------------------------------------------
-- Immutable-ish audit trail
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  organization_id uuid references public.organizations(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  details jsonb not null default '{}'::jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_org_time_idx
  on public.audit_logs(organization_id, created_at desc);
create index if not exists audit_logs_resource_idx
  on public.audit_logs(resource_type, resource_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Device groups
-- ---------------------------------------------------------------------------
create table if not exists public.device_groups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists public.device_group_members (
  group_id uuid not null references public.device_groups(id) on delete cascade,
  device_id uuid not null references public.devices(id) on delete cascade,
  primary key (group_id, device_id)
);

create index if not exists device_groups_org_idx on public.device_groups(organization_id);
create index if not exists device_group_members_device_idx on public.device_group_members(device_id);

-- ---------------------------------------------------------------------------
-- Timestamp trigger
-- ---------------------------------------------------------------------------
create or replace function public.machine_connect_touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists organizations_touch_updated_at on public.organizations;
create trigger organizations_touch_updated_at
before update on public.organizations
for each row execute function public.machine_connect_touch_updated_at();

drop trigger if exists devices_touch_updated_at on public.devices;
create trigger devices_touch_updated_at
before update on public.devices
for each row execute function public.machine_connect_touch_updated_at();

drop trigger if exists rules_touch_updated_at on public.rules;
create trigger rules_touch_updated_at
before update on public.rules
for each row execute function public.machine_connect_touch_updated_at();

drop trigger if exists webhooks_touch_updated_at on public.webhooks;
create trigger webhooks_touch_updated_at
before update on public.webhooks
for each row execute function public.machine_connect_touch_updated_at();

drop trigger if exists device_groups_touch_updated_at on public.device_groups;
create trigger device_groups_touch_updated_at
before update on public.device_groups
for each row execute function public.machine_connect_touch_updated_at();

-- ---------------------------------------------------------------------------
-- Private authorization helpers
-- ---------------------------------------------------------------------------
create or replace function private.current_organization_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select om.organization_id
  from public.organization_members om
  where om.user_id = (select auth.uid());
$$;

create or replace function private.has_organization_role(org_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = org_id
      and om.user_id = (select auth.uid())
      and om.role = any(allowed_roles)
  );
$$;

revoke execute on function private.current_organization_ids() from public;
revoke execute on function private.has_organization_role(uuid, text[]) from public;
grant usage on schema private to authenticated;
grant execute on function private.current_organization_ids() to authenticated;
grant execute on function private.has_organization_role(uuid, text[]) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.devices enable row level security;
alter table public.device_telemetry enable row level security;
alter table public.device_commands enable row level security;
alter table public.rules enable row level security;
alter table public.webhooks enable row level security;
alter table public.audit_logs enable row level security;
alter table public.device_groups enable row level security;
alter table public.device_group_members enable row level security;

-- No anonymous Data API access.
revoke all on public.organizations from anon;
revoke all on public.organization_members from anon;
revoke all on public.devices from anon;
revoke all on public.device_telemetry from anon;
revoke all on public.device_commands from anon;
revoke all on public.rules from anon;
revoke all on public.webhooks from anon;
revoke all on public.audit_logs from anon;
revoke all on public.device_groups from anon;
revoke all on public.device_group_members from anon;

-- Authenticated role gets only the operations covered by RLS below.
grant select, insert, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;
grant select, insert, update, delete on public.devices to authenticated;
grant select on public.device_telemetry to authenticated;
grant select, insert on public.device_commands to authenticated;
grant select, insert, update, delete on public.rules to authenticated;
grant select, insert, update, delete on public.webhooks to authenticated;
grant select on public.audit_logs to authenticated;
grant select, insert, update, delete on public.device_groups to authenticated;
grant select, insert, delete on public.device_group_members to authenticated;

drop policy if exists organizations_select on public.organizations;
create policy organizations_select on public.organizations for select to authenticated
using (id in (select private.current_organization_ids()));

drop policy if exists organizations_insert on public.organizations;
create policy organizations_insert on public.organizations for insert to authenticated
with check (true);

drop policy if exists organizations_update on public.organizations;
create policy organizations_update on public.organizations for update to authenticated
using (private.has_organization_role(id, array['admin']))
with check (private.has_organization_role(id, array['admin']));

drop policy if exists organizations_delete on public.organizations;
create policy organizations_delete on public.organizations for delete to authenticated
using (private.has_organization_role(id, array['admin']));

-- Membership rows are protected by the helper to avoid recursive RLS.
drop policy if exists organization_members_select on public.organization_members;
create policy organization_members_select on public.organization_members for select to authenticated
using (organization_id in (select private.current_organization_ids()));

drop policy if exists organization_members_insert on public.organization_members;
create policy organization_members_insert on public.organization_members for insert to authenticated
with check (private.has_organization_role(organization_id, array['admin']) or (user_id = (select auth.uid()) and not exists (select 1 from public.organization_members om where om.organization_id = organization_id)));

drop policy if exists organization_members_update on public.organization_members;
create policy organization_members_update on public.organization_members for update to authenticated
using (private.has_organization_role(organization_id, array['admin']))
with check (private.has_organization_role(organization_id, array['admin']));

drop policy if exists organization_members_delete on public.organization_members;
create policy organization_members_delete on public.organization_members for delete to authenticated
using (private.has_organization_role(organization_id, array['admin']) or user_id = (select auth.uid()));

-- Devices: admin/operator can manage; every member can read.
drop policy if exists devices_select on public.devices;
create policy devices_select on public.devices for select to authenticated
using (organization_id in (select private.current_organization_ids()));

drop policy if exists devices_insert on public.devices;
create policy devices_insert on public.devices for insert to authenticated
with check (private.has_organization_role(organization_id, array['admin','operator']));

drop policy if exists devices_update on public.devices;
create policy devices_update on public.devices for update to authenticated
using (private.has_organization_role(organization_id, array['admin','operator']))
with check (private.has_organization_role(organization_id, array['admin','operator']));

drop policy if exists devices_delete on public.devices;
create policy devices_delete on public.devices for delete to authenticated
using (private.has_organization_role(organization_id, array['admin']));

-- Telemetry is read-only from the browser. Ingestion is backend/service-role only.
drop policy if exists telemetry_select on public.device_telemetry;
create policy telemetry_select on public.device_telemetry for select to authenticated
using (organization_id in (select private.current_organization_ids()));

-- Commands can be requested by admins/operators; Core must still perform the safety pipeline.
drop policy if exists commands_select on public.device_commands;
create policy commands_select on public.device_commands for select to authenticated
using (organization_id in (select private.current_organization_ids()));

drop policy if exists commands_insert on public.device_commands;
create policy commands_insert on public.device_commands for insert to authenticated
with check (
  requested_by = (select auth.uid())
  and private.has_organization_role(organization_id, array['admin','operator'])
);

-- Rules.
drop policy if exists rules_select on public.rules;
create policy rules_select on public.rules for select to authenticated
using (organization_id in (select private.current_organization_ids()));

drop policy if exists rules_insert on public.rules;
create policy rules_insert on public.rules for insert to authenticated
with check (created_by = (select auth.uid()) and private.has_organization_role(organization_id, array['admin','operator']));

drop policy if exists rules_update on public.rules;
create policy rules_update on public.rules for update to authenticated
using (private.has_organization_role(organization_id, array['admin','operator']))
with check (private.has_organization_role(organization_id, array['admin','operator']));

drop policy if exists rules_delete on public.rules;
create policy rules_delete on public.rules for delete to authenticated
using (private.has_organization_role(organization_id, array['admin']));

-- Webhooks: admin only; URLs are HTTPS-only.
drop policy if exists webhooks_select on public.webhooks;
create policy webhooks_select on public.webhooks for select to authenticated
using (organization_id in (select private.current_organization_ids()));

drop policy if exists webhooks_insert on public.webhooks;
create policy webhooks_insert on public.webhooks for insert to authenticated
with check (private.has_organization_role(organization_id, array['admin']));

drop policy if exists webhooks_update on public.webhooks;
create policy webhooks_update on public.webhooks for update to authenticated
using (private.has_organization_role(organization_id, array['admin']))
with check (private.has_organization_role(organization_id, array['admin']));

drop policy if exists webhooks_delete on public.webhooks;
create policy webhooks_delete on public.webhooks for delete to authenticated
using (private.has_organization_role(organization_id, array['admin']));

-- Audit logs are backend-written and admin-readable.
drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs for select to authenticated
using (private.has_organization_role(organization_id, array['admin']));

-- Device groups.
drop policy if exists device_groups_select on public.device_groups;
create policy device_groups_select on public.device_groups for select to authenticated
using (organization_id in (select private.current_organization_ids()));

drop policy if exists device_groups_insert on public.device_groups;
create policy device_groups_insert on public.device_groups for insert to authenticated
with check (private.has_organization_role(organization_id, array['admin','operator']));

drop policy if exists device_groups_update on public.device_groups;
create policy device_groups_update on public.device_groups for update to authenticated
using (private.has_organization_role(organization_id, array['admin','operator']))
with check (private.has_organization_role(organization_id, array['admin','operator']));

drop policy if exists device_groups_delete on public.device_groups;
create policy device_groups_delete on public.device_groups for delete to authenticated
using (private.has_organization_role(organization_id, array['admin']));

drop policy if exists device_group_members_select on public.device_group_members;
create policy device_group_members_select on public.device_group_members for select to authenticated
using (exists (select 1 from public.device_groups g where g.id = group_id and g.organization_id in (select private.current_organization_ids())));

drop policy if exists device_group_members_insert on public.device_group_members;
create policy device_group_members_insert on public.device_group_members for insert to authenticated
with check (exists (select 1 from public.device_groups g where g.id = group_id and private.has_organization_role(g.organization_id, array['admin','operator'])) and exists (select 1 from public.devices d join public.device_groups g on g.organization_id = d.organization_id where d.id = device_id and g.id = group_id));

drop policy if exists device_group_members_delete on public.device_group_members;
create policy device_group_members_delete on public.device_group_members for delete to authenticated
using (exists (select 1 from public.device_groups g where g.id = group_id and private.has_organization_role(g.organization_id, array['admin','operator'])));

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
-- Postgres Changes is retained for the initial dashboard implementation.
-- For high-volume telemetry at scale, move the live UI path to Realtime Broadcast.
do $$
begin
  alter publication supabase_realtime add table public.devices;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.device_telemetry;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.device_commands;
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Safe helper views/functions for common reads
-- ---------------------------------------------------------------------------
create or replace function public.machine_connect_latest_telemetry(target_device_id uuid)
returns table (
  id bigint,
  device_id uuid,
  observed_at timestamptz,
  quality text,
  data jsonb
)
language sql
stable
security invoker
set search_path = public
as $$
  select t.id, t.device_id, t.observed_at, t.quality, t.data
  from public.device_telemetry t
  where t.device_id = target_device_id
  order by t.observed_at desc
  limit 1;
$$;

revoke execute on function public.machine_connect_latest_telemetry(uuid) from anon;
grant execute on function public.machine_connect_latest_telemetry(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Verification queries (run manually after applying the migration)
-- ---------------------------------------------------------------------------
-- select table_name from information_schema.tables
-- where table_schema = 'public'
--   and table_name in ('organizations','organization_members','devices','device_telemetry','device_commands','rules','webhooks','audit_logs','device_groups','device_group_members')
-- order by table_name;
--
-- select schemaname, tablename, rowsecurity
-- from pg_tables
-- where schemaname = 'public'
--   and tablename in ('organizations','organization_members','devices','device_telemetry','device_commands','rules','webhooks','audit_logs','device_groups','device_group_members');
--
-- select schemaname, tablename
-- from pg_publication_tables
-- where pubname = 'supabase_realtime'
--   and tablename in ('devices','device_telemetry','device_commands');
