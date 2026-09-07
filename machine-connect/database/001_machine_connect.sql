-- Merveil Machine Connect foundation. Production schema with fail-closed RLS.
create extension if not exists pgcrypto;

create table if not exists public.machine_connect_machines (
  id uuid primary key default gen_random_uuid(),
  machine_identity text not null unique,
  name text not null,
  machine_type text not null,
  state text not null default 'OFFLINE',
  owner_id uuid not null references auth.users(id) on delete cascade,
  capabilities jsonb not null default '[]'::jsonb,
  trust_level text not null default 'UNKNOWN',
  last_heartbeat_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint machine_state_check check (state in ('ONLINE','OFFLINE','CONNECTING','IDLE','ACTIVE','WARNING','CRITICAL','MAINTENANCE','LOCKED','EMERGENCY_STOP'))
);

create table if not exists public.machine_connect_events (id uuid primary key default gen_random_uuid(), machine_id uuid not null references public.machine_connect_machines(id) on delete cascade, event_type text not null, actor_id uuid references auth.users(id) on delete set null, payload jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
create table if not exists public.machine_connect_commands (id uuid primary key default gen_random_uuid(), machine_id uuid not null references public.machine_connect_machines(id) on delete cascade, action text not null, parameters jsonb not null default '{}'::jsonb, requested_by uuid references auth.users(id) on delete set null, status text not null default 'REQUESTED', rejection_reason text, created_at timestamptz not null default now(), completed_at timestamptz);
create table if not exists public.machine_connect_telemetry (id bigint generated always as identity primary key, machine_id uuid not null references public.machine_connect_machines(id) on delete cascade, metric_name text not null, metric_value double precision, unit text, metadata jsonb not null default '{}'::jsonb, recorded_at timestamptz not null default now());

create index if not exists machine_connect_events_machine_time on public.machine_connect_events(machine_id, created_at desc);
create index if not exists machine_connect_commands_machine_time on public.machine_connect_commands(machine_id, created_at desc);
create index if not exists machine_connect_telemetry_machine_time on public.machine_connect_telemetry(machine_id, recorded_at desc);

alter table public.machine_connect_machines enable row level security;
alter table public.machine_connect_events enable row level security;
alter table public.machine_connect_commands enable row level security;
alter table public.machine_connect_telemetry enable row level security;

create or replace function public.machine_connect_touch_updated_at() returns trigger language plpgsql security invoker set search_path = public as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists machine_connect_machines_touch on public.machine_connect_machines;
create trigger machine_connect_machines_touch before update on public.machine_connect_machines for each row execute function public.machine_connect_touch_updated_at();

drop policy if exists machine_connect_machines_owner_select on public.machine_connect_machines;
drop policy if exists machine_connect_machines_owner_insert on public.machine_connect_machines;
drop policy if exists machine_connect_machines_owner_update on public.machine_connect_machines;
drop policy if exists machine_connect_machines_owner_delete on public.machine_connect_machines;
create policy machine_connect_machines_owner_select on public.machine_connect_machines for select to authenticated using (owner_id = auth.uid());
create policy machine_connect_machines_owner_insert on public.machine_connect_machines for insert to authenticated with check (owner_id = auth.uid());
create policy machine_connect_machines_owner_update on public.machine_connect_machines for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy machine_connect_machines_owner_delete on public.machine_connect_machines for delete to authenticated using (owner_id = auth.uid());

drop policy if exists machine_connect_events_owner_select on public.machine_connect_events;
drop policy if exists machine_connect_events_owner_insert on public.machine_connect_events;
create policy machine_connect_events_owner_select on public.machine_connect_events for select to authenticated using (exists (select 1 from public.machine_connect_machines m where m.id = machine_id and m.owner_id = auth.uid()));
create policy machine_connect_events_owner_insert on public.machine_connect_events for insert to authenticated with check (actor_id = auth.uid() and exists (select 1 from public.machine_connect_machines m where m.id = machine_id and m.owner_id = auth.uid()));

drop policy if exists machine_connect_commands_owner_select on public.machine_connect_commands;
drop policy if exists machine_connect_commands_owner_insert on public.machine_connect_commands;
create policy machine_connect_commands_owner_select on public.machine_connect_commands for select to authenticated using (exists (select 1 from public.machine_connect_machines m where m.id = machine_id and m.owner_id = auth.uid()));
create policy machine_connect_commands_owner_insert on public.machine_connect_commands for insert to authenticated with check (requested_by = auth.uid() and exists (select 1 from public.machine_connect_machines m where m.id = machine_id and m.owner_id = auth.uid()));

drop policy if exists machine_connect_telemetry_owner_select on public.machine_connect_telemetry;
drop policy if exists machine_connect_telemetry_owner_insert on public.machine_connect_telemetry;
create policy machine_connect_telemetry_owner_select on public.machine_connect_telemetry for select to authenticated using (exists (select 1 from public.machine_connect_machines m where m.id = machine_id and m.owner_id = auth.uid()));
create policy machine_connect_telemetry_owner_insert on public.machine_connect_telemetry for insert to authenticated with check (exists (select 1 from public.machine_connect_machines m where m.id = machine_id and m.owner_id = auth.uid()));

revoke all on public.machine_connect_machines from anon;
revoke all on public.machine_connect_events from anon;
revoke all on public.machine_connect_commands from anon;
revoke all on public.machine_connect_telemetry from anon;
