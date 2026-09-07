-- Merveil Machine Connect foundation. Apply through Supabase migrations in production.
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

create table if not exists public.machine_connect_events (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references public.machine_connect_machines(id) on delete cascade,
  event_type text not null,
  actor_id uuid references auth.users(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.machine_connect_commands (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references public.machine_connect_machines(id) on delete cascade,
  action text not null,
  parameters jsonb not null default '{}'::jsonb,
  requested_by uuid references auth.users(id) on delete set null,
  status text not null default 'REQUESTED',
  rejection_reason text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.machine_connect_telemetry (
  id bigint generated always as identity primary key,
  machine_id uuid not null references public.machine_connect_machines(id) on delete cascade,
  metric_name text not null,
  metric_value double precision,
  unit text,
  metadata jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now()
);

create index if not exists machine_connect_events_machine_time on public.machine_connect_events(machine_id, created_at desc);
create index if not exists machine_connect_commands_machine_time on public.machine_connect_commands(machine_id, created_at desc);
create index if not exists machine_connect_telemetry_machine_time on public.machine_connect_telemetry(machine_id, recorded_at desc);

alter table public.machine_connect_machines enable row level security;
alter table public.machine_connect_events enable row level security;
alter table public.machine_connect_commands enable row level security;
alter table public.machine_connect_telemetry enable row level security;

-- Fail closed until explicit organization/owner policies are added.
