create table if not exists public.machine_connect_fleets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  name text not null check (length(trim(name)) between 1 and 160),
  description text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists public.machine_connect_fleet_members (
  fleet_id uuid not null references public.machine_connect_fleets(id) on delete cascade,
  machine_id uuid not null references public.machine_connect_machines(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (fleet_id, machine_id)
);

create table if not exists public.machine_connect_bulk_operations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  fleet_id uuid references public.machine_connect_fleets(id) on delete set null,
  requested_by uuid,
  capability text not null,
  parameters jsonb not null default '{}'::jsonb,
  safety_class text not null default 'control' check (safety_class in ('read','control','critical')),
  status text not null default 'pending' check (status in ('pending','running','completed','partial','failed','cancelled')),
  total_count integer not null default 0,
  accepted_count integer not null default 0,
  rejected_count integer not null default 0,
  completed_count integer not null default 0,
  failed_count integer not null default 0,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create table if not exists public.machine_connect_bulk_operation_items (
  id uuid primary key default gen_random_uuid(),
  bulk_operation_id uuid not null references public.machine_connect_bulk_operations(id) on delete cascade,
  organization_id uuid not null,
  machine_id uuid not null references public.machine_connect_machines(id) on delete cascade,
  command_id uuid references public.machine_connect_commands(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','accepted','rejected','completed','failed')),
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bulk_operation_id, machine_id)
);

create index if not exists machine_connect_fleet_members_machine_idx on public.machine_connect_fleet_members(machine_id);
create index if not exists machine_connect_bulk_operations_org_idx on public.machine_connect_bulk_operations(organization_id, created_at desc);
create index if not exists machine_connect_bulk_items_operation_idx on public.machine_connect_bulk_operation_items(bulk_operation_id, status);

alter table public.machine_connect_fleets enable row level security;
alter table public.machine_connect_fleet_members enable row level security;
alter table public.machine_connect_bulk_operations enable row level security;
alter table public.machine_connect_bulk_operation_items enable row level security;

revoke all on public.machine_connect_fleets from anon, authenticated;
revoke all on public.machine_connect_fleet_members from anon, authenticated;
revoke all on public.machine_connect_bulk_operations from anon, authenticated;
revoke all on public.machine_connect_bulk_operation_items from anon, authenticated;
