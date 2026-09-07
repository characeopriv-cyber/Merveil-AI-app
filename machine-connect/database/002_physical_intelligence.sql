-- Merveil Machine Connect: physical intelligence workspace.
-- Stores evidence and reasoning artifacts separately from physical execution.
-- Safe to re-run.

create table if not exists public.machine_connect_evidence (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references public.machine_connect_machines(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  evidence_type text not null check (evidence_type in ('IMAGE','VIDEO','AUDIO','TELEMETRY','DOCUMENT','LOG','TEXT','LIVE_CAMERA','LIVE_AUDIO')),
  source_uri text,
  mime_type text,
  title text,
  metadata jsonb not null default '{}'::jsonb,
  captured_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.machine_connect_analysis_jobs (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references public.machine_connect_machines(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  job_type text not null check (job_type in ('IDENTIFY','INSPECT','DIAGNOSE','REPAIR_PLAN','REBUILD_PLAN','SIMULATE','TRANSCRIBE','MULTIMODAL')),
  status text not null default 'QUEUED' check (status in ('QUEUED','RUNNING','SUCCEEDED','FAILED','CANCELLED')),
  input jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  error_message text,
  requested_model text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create table if not exists public.machine_connect_diagnoses (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references public.machine_connect_machines(id) on delete cascade,
  analysis_job_id uuid references public.machine_connect_analysis_jobs(id) on delete set null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  summary text not null,
  confidence numeric(5,4),
  evidence jsonb not null default '[]'::jsonb,
  hypotheses jsonb not null default '[]'::jsonb,
  severity text,
  created_at timestamptz not null default now()
);

create table if not exists public.machine_connect_repair_plans (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references public.machine_connect_machines(id) on delete cascade,
  analysis_job_id uuid references public.machine_connect_analysis_jobs(id) on delete set null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  status text not null default 'DRAFT' check (status in ('DRAFT','REVIEW','APPROVED','EXECUTING','COMPLETED','BLOCKED')),
  prerequisites jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  parts jsonb not null default '[]'::jsonb,
  validation jsonb not null default '[]'::jsonb,
  rollback jsonb not null default '[]'::jsonb,
  safety_notes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.machine_connect_model_runs (
  id uuid primary key default gen_random_uuid(),
  analysis_job_id uuid not null references public.machine_connect_analysis_jobs(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  model text not null,
  modality text,
  status text not null default 'REQUESTED',
  input_tokens integer,
  output_tokens integer,
  latency_ms integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.machine_connect_simulations (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid references public.machine_connect_machines(id) on delete set null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  engine text,
  scenario jsonb not null default '{}'::jsonb,
  state jsonb not null default '{}'::jsonb,
  status text not null default 'DRAFT' check (status in ('DRAFT','READY','RUNNING','COMPLETED','FAILED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.machine_connect_connectors (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references public.machine_connect_machines(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  protocol text not null check (protocol in ('MQTT','WEBSOCKET','HTTP','SERIAL','USB','BLE','CAN','MODBUS','OPC_UA','SIP')),
  endpoint text,
  status text not null default 'CONFIGURED',
  capabilities jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists machine_connect_evidence_machine_time on public.machine_connect_evidence(machine_id, created_at desc);
create index if not exists machine_connect_analysis_machine_time on public.machine_connect_analysis_jobs(machine_id, created_at desc);
create index if not exists machine_connect_diagnoses_machine_time on public.machine_connect_diagnoses(machine_id, created_at desc);
create index if not exists machine_connect_repairs_machine_time on public.machine_connect_repair_plans(machine_id, created_at desc);
create index if not exists machine_connect_model_runs_job_time on public.machine_connect_model_runs(analysis_job_id, created_at desc);
create index if not exists machine_connect_simulations_owner_time on public.machine_connect_simulations(owner_id, created_at desc);
create index if not exists machine_connect_connectors_machine on public.machine_connect_connectors(machine_id);

alter table public.machine_connect_evidence enable row level security;
alter table public.machine_connect_analysis_jobs enable row level security;
alter table public.machine_connect_diagnoses enable row level security;
alter table public.machine_connect_repair_plans enable row level security;
alter table public.machine_connect_model_runs enable row level security;
alter table public.machine_connect_simulations enable row level security;
alter table public.machine_connect_connectors enable row level security;

create or replace function public.machine_connect_touch_physical_intelligence_updated_at() returns trigger language plpgsql security invoker set search_path = public as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists machine_connect_repair_plans_touch on public.machine_connect_repair_plans;
create trigger machine_connect_repair_plans_touch before update on public.machine_connect_repair_plans for each row execute function public.machine_connect_touch_physical_intelligence_updated_at();
drop trigger if exists machine_connect_simulations_touch on public.machine_connect_simulations;
create trigger machine_connect_simulations_touch before update on public.machine_connect_simulations for each row execute function public.machine_connect_touch_physical_intelligence_updated_at();

-- Owner isolation. Physical execution remains outside these tables.
create policy machine_connect_evidence_owner_all on public.machine_connect_evidence for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy machine_connect_analysis_owner_all on public.machine_connect_analysis_jobs for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy machine_connect_diagnoses_owner_all on public.machine_connect_diagnoses for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy machine_connect_repairs_owner_all on public.machine_connect_repair_plans for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy machine_connect_model_runs_owner_all on public.machine_connect_model_runs for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy machine_connect_simulations_owner_all on public.machine_connect_simulations for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy machine_connect_connectors_owner_all on public.machine_connect_connectors for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

revoke all on public.machine_connect_evidence from anon;
revoke all on public.machine_connect_analysis_jobs from anon;
revoke all on public.machine_connect_diagnoses from anon;
revoke all on public.machine_connect_repair_plans from anon;
revoke all on public.machine_connect_model_runs from anon;
revoke all on public.machine_connect_simulations from anon;
revoke all on public.machine_connect_connectors from anon;
