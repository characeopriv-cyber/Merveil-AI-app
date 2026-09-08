-- Machine Connect offline PostgreSQL schema.
-- Separate local database; does not replace the hardened Supabase schema.
create extension if not exists pgcrypto;

create table if not exists devices (
  id uuid primary key default gen_random_uuid(),
  device_id text not null unique,
  name text not null,
  type text not null,
  protocol text not null default 'mqtt',
  capabilities jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'offline',
  last_seen timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists telemetry (
  id bigint generated always as identity primary key,
  device_id text not null references devices(device_id) on delete cascade,
  event_id uuid,
  sequence bigint,
  timestamp timestamptz not null default now(),
  data jsonb not null
);

create unique index if not exists telemetry_event_id_uidx on telemetry(event_id) where event_id is not null;
create index if not exists telemetry_device_time_idx on telemetry(device_id, timestamp desc);

create table if not exists commands (
  id uuid primary key default gen_random_uuid(),
  device_id text not null references devices(device_id) on delete cascade,
  command jsonb not null,
  status text not null default 'pending',
  idempotency_key text unique,
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz
);
create index if not exists commands_device_time_idx on commands(device_id, created_at desc);

create table if not exists rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trigger_type text not null default 'telemetry',
  condition jsonb not null default '{}'::jsonb,
  action jsonb not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists sync_queue (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id text not null,
  operation text not null check (operation in ('insert','update','delete')),
  data jsonb,
  synced boolean not null default false,
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  synced_at timestamptz
);
create index if not exists sync_queue_pending_idx on sync_queue(synced, id) where synced = false;

create table if not exists audit_logs (
  id bigint generated always as identity primary key,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function touch_device_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists devices_touch_updated_at on devices;
create trigger devices_touch_updated_at before update on devices
for each row execute function touch_device_updated_at();
