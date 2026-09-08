create table if not exists public.machine_connect_security_events (
  id bigint generated always as identity primary key,
  organization_id uuid,
  actor_id text,
  event_type text not null,
  severity text not null default 'info' check (severity in ('debug','info','warn','error','critical')),
  request_id text,
  trace_id text,
  resource_type text,
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_mc_security_events_org_time on public.machine_connect_security_events(organization_id, created_at desc);
create index if not exists idx_mc_security_events_request on public.machine_connect_security_events(request_id) where request_id is not null;

alter table public.machine_connect_security_events enable row level security;
drop policy if exists mc_security_events_service_only on public.machine_connect_security_events;
create policy mc_security_events_service_only on public.machine_connect_security_events for all to service_role using (true) with check (true);
revoke all on public.machine_connect_security_events from anon, authenticated;
grant select, insert, update, delete on public.machine_connect_security_events to service_role;
