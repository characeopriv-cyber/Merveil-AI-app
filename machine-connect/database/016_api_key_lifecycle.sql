create table if not exists public.machine_connect_api_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (length(name) between 1 and 120),
  key_prefix text not null,
  secret_hash text not null,
  enabled boolean not null default true,
  expires_at timestamptz,
  last_used_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique(organization_id, key_prefix)
);
create index if not exists idx_mc_api_keys_org on public.machine_connect_api_keys(organization_id);
create index if not exists idx_mc_api_keys_active on public.machine_connect_api_keys(organization_id, enabled, revoked_at);
alter table public.machine_connect_api_keys enable row level security;
drop policy if exists mc_api_keys_select on public.machine_connect_api_keys;
create policy mc_api_keys_select on public.machine_connect_api_keys for select to authenticated using (
 exists (select 1 from public.organization_members om where om.organization_id=machine_connect_api_keys.organization_id and om.user_id=auth.uid())
);
drop policy if exists mc_api_keys_manage on public.machine_connect_api_keys;
create policy mc_api_keys_manage on public.machine_connect_api_keys for all to authenticated using (
 exists (select 1 from public.organization_members om where om.organization_id=machine_connect_api_keys.organization_id and om.user_id=auth.uid() and om.role in ('owner','admin'))
) with check (
 exists (select 1 from public.organization_members om where om.organization_id=machine_connect_api_keys.organization_id and om.user_id=auth.uid() and om.role in ('owner','admin'))
);
