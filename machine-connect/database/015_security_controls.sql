create table if not exists public.machine_connect_security_controls (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  control_key text not null,
  enabled boolean not null default true,
  configuration jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (organization_id, control_key)
);

create index if not exists idx_mc_security_controls_org on public.machine_connect_security_controls(organization_id);

alter table public.machine_connect_security_controls enable row level security;
drop policy if exists mc_security_controls_select on public.machine_connect_security_controls;
create policy mc_security_controls_select on public.machine_connect_security_controls for select to authenticated using (
  exists (select 1 from public.organization_members om where om.organization_id = machine_connect_security_controls.organization_id and om.user_id = auth.uid())
);
drop policy if exists mc_security_controls_manage on public.machine_connect_security_controls;
create policy mc_security_controls_manage on public.machine_connect_security_controls for all to authenticated using (
  exists (select 1 from public.organization_members om where om.organization_id = machine_connect_security_controls.organization_id and om.user_id = auth.uid() and om.role in ('owner','admin'))
) with check (
  exists (select 1 from public.organization_members om where om.organization_id = machine_connect_security_controls.organization_id and om.user_id = auth.uid() and om.role in ('owner','admin'))
);
