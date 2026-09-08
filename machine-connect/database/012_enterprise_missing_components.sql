-- Machine Connect enterprise foundations.
-- Production migration applied as enterprise_missing_components_v1.
-- Includes lifecycle/legal hold, compliance metadata/evidence, KMS/HSM metadata,
-- ML registry/deployments, network slices, connectors, marketplace, billing,
-- training, support, API keys and data residency with tenant RLS.

-- NOTE: actual secrets/cryptographic material must remain in an external KMS/HSM.
-- connector config is metadata only; do not store plaintext credentials here.

create table if not exists public.retention_policies (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  table_name text not null,
  retention_days integer not null check (retention_days > 0),
  description text,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, table_name)
);
create table if not exists public.legal_holds (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null, entity_id text, reason text, start_date timestamptz not null default now(), end_date timestamptz,
  created_by uuid references public.profiles(id), check (end_date is null or end_date >= start_date)
);
create table if not exists public.compliance_frameworks (id uuid primary key default gen_random_uuid(), name text unique not null, version text, created_at timestamptz not null default now());
create table if not exists public.compliance_controls (id uuid primary key default gen_random_uuid(), framework_id uuid not null references public.compliance_frameworks(id) on delete cascade, control_id text not null, title text, description text, unique(framework_id, control_id));
create table if not exists public.compliance_evidence (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, control_id uuid not null references public.compliance_controls(id) on delete cascade, evidence_type text not null, storage_path text, description text, collected_at timestamptz not null default now(), collected_by uuid references public.profiles(id));
create table if not exists public.crypto_keys (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, key_alias text not null, key_type text not null, purpose text not null, hsm_provider text not null, created_at timestamptz not null default now(), rotation_interval_days integer not null default 90 check(rotation_interval_days > 0), last_rotated_at timestamptz);
create table if not exists public.ml_models (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, name text not null, version text not null, description text, framework text, storage_path text, created_by uuid references public.profiles(id), created_at timestamptz not null default now(), unique(organization_id,name,version));
create table if not exists public.model_deployments (id uuid primary key default gen_random_uuid(), model_id uuid not null references public.ml_models(id) on delete cascade, device_id uuid not null references public.devices(id) on delete cascade, deployed_at timestamptz not null default now(), status text not null default 'pending' check(status in ('pending','active','failed')), metadata jsonb not null default '{}'::jsonb);
create table if not exists public.network_slices (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, slice_name text not null, slice_type text not null check(slice_type in ('eMBB','uRLLC','mMTC')), qos_profile jsonb not null default '{}'::jsonb, status text not null default 'provisioned', created_at timestamptz not null default now());
create table if not exists public.slice_assignments (slice_id uuid not null references public.network_slices(id) on delete cascade, device_id uuid not null references public.devices(id) on delete cascade, assigned_at timestamptz not null default now(), primary key(slice_id,device_id));
create table if not exists public.connectors (id uuid primary key default gen_random_uuid(), name text unique not null, connector_type text not null, description text, configuration_schema jsonb not null default '{}'::jsonb);
create table if not exists public.connector_instances (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, connector_id uuid not null references public.connectors(id) on delete cascade, name text not null, config jsonb not null default '{}'::jsonb, status text not null default 'active', created_at timestamptz not null default now());
create table if not exists public.marketplace_apps (id uuid primary key default gen_random_uuid(), name text not null, description text, developer_id uuid references public.profiles(id), price numeric(14,2) not null default 0 check(price >= 0), category text, version text, created_at timestamptz not null default now());
create table if not exists public.app_installations (app_id uuid not null references public.marketplace_apps(id) on delete cascade, organization_id uuid not null references public.organizations(id) on delete cascade, installed_at timestamptz not null default now(), status text not null default 'active', primary key(app_id,organization_id));
create table if not exists public.plans (id uuid primary key default gen_random_uuid(), name text unique not null, price numeric(14,2) not null check(price >= 0), billing_cycle text not null default 'monthly', features jsonb not null default '{}'::jsonb);
create table if not exists public.subscriptions (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, plan_id uuid references public.plans(id), status text not null default 'active', started_at timestamptz not null default now(), cancelled_at timestamptz, trial_ends_at timestamptz);
create table if not exists public.usage_records (id bigint generated always as identity primary key, organization_id uuid not null references public.organizations(id) on delete cascade, metric text not null, quantity numeric not null default 0 check(quantity >= 0), recorded_at timestamptz not null default now());
create table if not exists public.invoices (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, invoice_number text unique, amount numeric(14,2) not null default 0 check(amount >= 0), currency text not null default 'USD', status text not null default 'open', due_date date, paid_at timestamptz);
create table if not exists public.courses (id uuid primary key default gen_random_uuid(), title text not null, description text, content_path text, duration_minutes integer check(duration_minutes is null or duration_minutes >= 0), created_at timestamptz not null default now());
create table if not exists public.enrollments (user_id uuid not null references public.profiles(id) on delete cascade, course_id uuid not null references public.courses(id) on delete cascade, enrolled_at timestamptz not null default now(), progress integer not null default 0 check(progress between 0 and 100), completed_at timestamptz, primary key(user_id,course_id));
create table if not exists public.certifications (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, course_id uuid not null references public.courses(id) on delete cascade, certificate_number text unique not null, issued_at timestamptz not null default now(), expires_at timestamptz);
create table if not exists public.forum_posts (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, author_id uuid references public.profiles(id), title text, body text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.support_tickets (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, subject text not null, description text, status text not null default 'open' check(status in ('open','in_progress','resolved')), priority text not null default 'normal', assigned_to uuid references public.profiles(id), created_by uuid references public.profiles(id), created_at timestamptz not null default now(), resolved_at timestamptz);
create table if not exists public.api_keys (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, api_key_hash text unique not null, name text not null, scopes text[] not null default '{}', rate_limit_per_minute integer not null default 100 check(rate_limit_per_minute > 0), created_by uuid references public.profiles(id), created_at timestamptz not null default now(), revoked_at timestamptz);
create table if not exists public.data_residency_policies (organization_id uuid primary key references public.organizations(id) on delete cascade, allowed_regions text[] not null default '{}', default_region text, updated_at timestamptz not null default now());

create or replace function public.is_org_member(p_org_id uuid) returns boolean language sql security definer stable set search_path=public as $$ select exists(select 1 from public.organization_members om where om.organization_id=p_org_id and om.user_id=auth.uid()); $$;
revoke all on function public.is_org_member(uuid) from public;
grant execute on function public.is_org_member(uuid) to authenticated;

-- Enable RLS on every new table. Policies are intentionally tenant-scoped; global catalogs are read-only to clients.
alter table public.retention_policies enable row level security;
alter table public.legal_holds enable row level security;
alter table public.compliance_frameworks enable row level security;
alter table public.compliance_controls enable row level security;
alter table public.compliance_evidence enable row level security;
alter table public.crypto_keys enable row level security;
alter table public.ml_models enable row level security;
alter table public.model_deployments enable row level security;
alter table public.network_slices enable row level security;
alter table public.slice_assignments enable row level security;
alter table public.connectors enable row level security;
alter table public.connector_instances enable row level security;
alter table public.marketplace_apps enable row level security;
alter table public.app_installations enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage_records enable row level security;
alter table public.invoices enable row level security;
alter table public.courses enable row level security;
alter table public.enrollments enable row level security;
alter table public.certifications enable row level security;
alter table public.forum_posts enable row level security;
alter table public.support_tickets enable row level security;
alter table public.api_keys enable row level security;
alter table public.data_residency_policies enable row level security;

create policy retention_select on public.retention_policies for select to authenticated using(public.is_org_member(organization_id));
create policy retention_insert on public.retention_policies for insert to authenticated with check(public.is_org_member(organization_id));
create policy retention_update on public.retention_policies for update to authenticated using(public.is_org_member(organization_id)) with check(public.is_org_member(organization_id));
create policy legal_holds_select on public.legal_holds for select to authenticated using(public.is_org_member(organization_id));
create policy legal_holds_insert on public.legal_holds for insert to authenticated with check(public.is_org_member(organization_id) and created_by=auth.uid());
create policy legal_holds_update on public.legal_holds for update to authenticated using(public.is_org_member(organization_id)) with check(public.is_org_member(organization_id));
create policy compliance_evidence_select on public.compliance_evidence for select to authenticated using(public.is_org_member(organization_id));
create policy compliance_evidence_insert on public.compliance_evidence for insert to authenticated with check(public.is_org_member(organization_id) and collected_by=auth.uid());
create policy compliance_evidence_update on public.compliance_evidence for update to authenticated using(public.is_org_member(organization_id)) with check(public.is_org_member(organization_id));
create policy crypto_keys_select on public.crypto_keys for select to authenticated using(public.is_org_member(organization_id));
create policy ml_models_select on public.ml_models for select to authenticated using(public.is_org_member(organization_id));
create policy model_deployments_select on public.model_deployments for select to authenticated using(exists(select 1 from public.ml_models m where m.id=model_deployments.model_id and public.is_org_member(m.organization_id)));
create policy network_slices_select on public.network_slices for select to authenticated using(public.is_org_member(organization_id));
create policy slice_assignments_select on public.slice_assignments for select to authenticated using(exists(select 1 from public.network_slices s where s.id=slice_assignments.slice_id and public.is_org_member(s.organization_id)));
create policy connector_instances_select on public.connector_instances for select to authenticated using(public.is_org_member(organization_id));
create policy app_installations_select on public.app_installations for select to authenticated using(public.is_org_member(organization_id));
create policy subscriptions_select on public.subscriptions for select to authenticated using(public.is_org_member(organization_id));
create policy usage_records_select on public.usage_records for select to authenticated using(public.is_org_member(organization_id));
create policy invoices_select on public.invoices for select to authenticated using(public.is_org_member(organization_id));
create policy forum_posts_select on public.forum_posts for select to authenticated using(public.is_org_member(organization_id));
create policy forum_posts_insert on public.forum_posts for insert to authenticated with check(public.is_org_member(organization_id) and author_id=auth.uid());
create policy support_tickets_select on public.support_tickets for select to authenticated using(public.is_org_member(organization_id));
create policy support_tickets_insert on public.support_tickets for insert to authenticated with check(public.is_org_member(organization_id) and created_by=auth.uid());
create policy support_tickets_update on public.support_tickets for update to authenticated using(public.is_org_member(organization_id));
create policy api_keys_select on public.api_keys for select to authenticated using(public.is_org_member(organization_id));
create policy api_keys_insert on public.api_keys for insert to authenticated with check(exists(select 1 from public.organization_members om where om.organization_id=api_keys.organization_id and om.user_id=auth.uid() and om.role in ('admin','owner')) and created_by=auth.uid());
create policy api_keys_update on public.api_keys for update to authenticated using(exists(select 1 from public.organization_members om where om.organization_id=api_keys.organization_id and om.user_id=auth.uid() and om.role in ('admin','owner'))) with check(public.is_org_member(organization_id));
create policy data_residency_select on public.data_residency_policies for select to authenticated using(public.is_org_member(organization_id));
create policy compliance_frameworks_select on public.compliance_frameworks for select to authenticated using(true);
create policy compliance_controls_select on public.compliance_controls for select to authenticated using(true);
create policy connectors_select on public.connectors for select to authenticated using(true);
create policy marketplace_apps_select on public.marketplace_apps for select to authenticated using(true);
create policy plans_select on public.plans for select to authenticated using(true);
create policy courses_select on public.courses for select to authenticated using(true);
create policy enrollments_select on public.enrollments for select to authenticated using(user_id=auth.uid());
create policy certifications_select on public.certifications for select to authenticated using(user_id=auth.uid());

create index if not exists idx_retention_policies_org on public.retention_policies(organization_id);
create index if not exists idx_legal_holds_org on public.legal_holds(organization_id);
create index if not exists idx_compliance_evidence_org on public.compliance_evidence(organization_id);
create index if not exists idx_crypto_keys_org on public.crypto_keys(organization_id);
create index if not exists idx_ml_models_org on public.ml_models(organization_id);
create index if not exists idx_model_deployments_device on public.model_deployments(device_id);
create index if not exists idx_network_slices_org on public.network_slices(organization_id);
create index if not exists idx_slice_assignments_device on public.slice_assignments(device_id);
create index if not exists idx_connector_instances_org on public.connector_instances(organization_id);
create index if not exists idx_app_installations_org on public.app_installations(organization_id);
create index if not exists idx_subscriptions_org on public.subscriptions(organization_id);
create index if not exists idx_usage_records_org_time on public.usage_records(organization_id,recorded_at desc);
create index if not exists idx_invoices_org on public.invoices(organization_id);
create index if not exists idx_enrollments_user on public.enrollments(user_id);
create index if not exists idx_certifications_user on public.certifications(user_id);
create index if not exists idx_forum_posts_org on public.forum_posts(organization_id);
create index if not exists idx_support_tickets_org on public.support_tickets(organization_id);
create index if not exists idx_api_keys_org on public.api_keys(organization_id);

alter publication supabase_realtime add table public.support_tickets;
alter publication supabase_realtime add table public.forum_posts;
