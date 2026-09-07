-- Machine Connect Digital Nation Builder + Advanced Modules
-- Safe extension of the existing tenant model. No dynamic SQL/table creation is used for AI forms.
create extension if not exists postgis;

alter table public.organizations add column if not exists org_type text not null default 'private';
alter table public.organizations add column if not exists parent_org_id uuid references public.organizations(id) on delete set null;
alter table public.organizations add column if not exists address jsonb not null default '{}'::jsonb;
alter table public.organizations add column if not exists logo_url text;
alter table public.organizations add column if not exists contact_info jsonb not null default '{}'::jsonb;

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  parent_department_id uuid references public.departments(id) on delete set null, name text not null,
  code text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists public.citizens (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null, citizen_reference text not null,
  display_name text, attributes jsonb not null default '{}'::jsonb,
  identity_commitment text, biometric_reference text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (organization_id, citizen_reference)
);

create table if not exists public.identity_documents (
  id uuid primary key default gen_random_uuid(), citizen_id uuid not null references public.citizens(id) on delete cascade,
  document_type text not null, issuer text, document_reference text not null, storage_path text,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected','expired')),
  issued_at date, expires_at date, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(),
  unique (citizen_id, document_type, document_reference)
);

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  citizen_id uuid references public.citizens(id) on delete set null, service_code text not null, title text not null,
  status text not null default 'submitted' check (status in ('draft','submitted','in_review','approved','rejected','completed','cancelled')),
  payload jsonb not null default '{}'::jsonb, created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.request_documents (
  request_id uuid not null references public.service_requests(id) on delete cascade,
  document_id uuid not null references public.identity_documents(id) on delete cascade,
  primary key (request_id, document_id)
);

create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null, version integer not null default 1, definition jsonb not null,
  enabled boolean not null default true, created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (organization_id, name, version)
);

create table if not exists public.workflow_instances (
  id uuid primary key default gen_random_uuid(), workflow_id uuid not null references public.workflows(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  subject_type text, subject_id text, status text not null default 'running' check (status in ('running','completed','failed','cancelled')),
  state jsonb not null default '{}'::jsonb, idempotency_key text, started_at timestamptz not null default now(), completed_at timestamptz,
  unique (organization_id, idempotency_key)
);

create table if not exists public.workflow_tasks (
  id uuid primary key default gen_random_uuid(), instance_id uuid not null references public.workflow_instances(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade, task_key text not null, status text not null default 'pending'
    check (status in ('pending','assigned','completed','rejected','skipped','expired')),
  assignee_user_id uuid references auth.users(id) on delete set null, input jsonb not null default '{}'::jsonb, output jsonb not null default '{}'::jsonb,
  due_at timestamptz, completed_at timestamptz, unique (instance_id, task_key)
);

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null, description text, status text not null default 'draft' check (status in ('draft','open','closed','archived')),
  poll_type text not null default 'civic_feedback' check (poll_type in ('civic_feedback','consultation','survey')),
  binding boolean not null default false, starts_at timestamptz, ends_at timestamptz, created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(), poll_id uuid not null references public.polls(id) on delete cascade,
  label text not null, sort_order integer not null default 0, unique (poll_id, sort_order)
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(), poll_id uuid not null references public.polls(id) on delete cascade,
  citizen_id uuid not null references public.citizens(id) on delete cascade, option_id uuid not null references public.poll_options(id) on delete restrict,
  commitment text, receipt text, created_at timestamptz not null default now(), unique (poll_id, citizen_id)
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null, fiscal_year integer not null, amount numeric not null check (amount >= 0), currency text not null default 'USD',
  status text not null default 'draft' check (status in ('draft','approved','active','closed')), created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  budget_id uuid references public.budgets(id) on delete set null, reference text not null, amount numeric not null,
  currency text not null default 'USD', transaction_type text not null, status text not null default 'recorded', metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), unique (organization_id, reference)
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null, document_type text, version integer not null default 1, storage_path text not null,
  content_hash text, status text not null default 'active' check (status in ('draft','active','superseded','archived')),
  created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.document_signatures (
  id uuid primary key default gen_random_uuid(), document_id uuid not null references public.documents(id) on delete cascade,
  signer_user_id uuid references auth.users(id) on delete set null, signature_reference text not null,
  algorithm text, signed_at timestamptz not null default now(), unique (document_id, signer_user_id, signature_reference)
);

create table if not exists public.spatial_assets (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  asset_type text not null, name text not null, properties jsonb not null default '{}'::jsonb,
  geom geometry(GEOMETRY,4326), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists spatial_assets_geom_gist on public.spatial_assets using gist (geom);

create table if not exists public.form_schemas (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  form_name text not null, schema jsonb not null, status text not null default 'draft' check (status in ('draft','published','archived')),
  created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.form_records (
  id uuid primary key default gen_random_uuid(), form_schema_id uuid not null references public.form_schemas(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete cascade, submitted_by uuid references auth.users(id) on delete set null,
  data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.federated_models (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  model_name text not null, global_version integer not null default 1, model_artifact_path text,
  created_at timestamptz not null default now(), unique (organization_id, model_name)
);

create table if not exists public.federated_rounds (
  id uuid primary key default gen_random_uuid(), model_id uuid not null references public.federated_models(id) on delete cascade,
  round_number integer not null, min_clients integer not null default 2, status text not null default 'pending',
  aggregate_artifact_path text, aggregate_hash text, metrics jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(), completed_at timestamptz, unique (model_id, round_number)
);

create table if not exists public.federated_updates (
  id uuid primary key default gen_random_uuid(), round_id uuid not null references public.federated_rounds(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade, participant_ref text not null,
  update_artifact_path text not null, update_hash text not null, sample_count integer not null check (sample_count > 0),
  metrics jsonb not null default '{}'::jsonb, received_at timestamptz not null default now(), unique (round_id, participant_ref)
);

create table if not exists public.provenance_anchors (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  resource_type text not null, resource_id text not null, content_hash text not null, provider text not null,
  external_reference text not null, anchored_at timestamptz not null default now(), unique (organization_id, resource_type, resource_id, content_hash)
);

create table if not exists public.land_parcels (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  parcel_id text not null, owner_citizen_id uuid references public.citizens(id) on delete set null,
  geom geometry(POLYGON,4326), area_sqm numeric check (area_sqm >= 0), status text not null default 'active'
    check (status in ('active','pending','disputed','inactive')), current_record_hash text, created_at timestamptz not null default now(),
  unique (organization_id, parcel_id)
);
create index if not exists land_parcels_geom_gist on public.land_parcels using gist (geom);

create table if not exists public.land_transfers (
  id uuid primary key default gen_random_uuid(), parcel_id uuid not null references public.land_parcels(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade, from_citizen_id uuid references public.citizens(id) on delete set null,
  to_citizen_id uuid references public.citizens(id) on delete set null, status text not null default 'requested'
    check (status in ('requested','approved','completed','rejected')), content_hash text, anchor_reference text,
  requested_by uuid references auth.users(id) on delete set null, approved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), completed_at timestamptz
);

-- RLS: all advanced tables are tenant-isolated through the existing private helper.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['departments','citizens','service_requests','workflows','workflow_instances','workflow_tasks','polls','poll_options','votes','budgets','transactions','documents','document_signatures','spatial_assets','form_schemas','form_records','federated_models','federated_rounds','federated_updates','provenance_anchors','land_parcels','land_transfers'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_select ON public.%I', t);
    EXECUTE format('CREATE POLICY tenant_select ON public.%I FOR SELECT TO authenticated USING (organization_id IN (SELECT private.current_organization_ids()))', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_insert ON public.%I', t);
    EXECUTE format('CREATE POLICY tenant_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (private.has_organization_role(organization_id, ARRAY[''admin'',''operator'',''member'']))', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_update ON public.%I', t);
    EXECUTE format('CREATE POLICY tenant_update ON public.%I FOR UPDATE TO authenticated USING (private.has_organization_role(organization_id, ARRAY[''admin'',''operator''])) WITH CHECK (private.has_organization_role(organization_id, ARRAY[''admin'',''operator'']))', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_delete ON public.%I', t);
    EXECUTE format('CREATE POLICY tenant_delete ON public.%I FOR DELETE TO authenticated USING (private.has_organization_role(organization_id, ARRAY[''admin'']))', t);
  END LOOP;
END $$;

-- Child tables without organization_id inherit isolation through their parent.
ALTER TABLE public.request_documents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.request_documents FROM anon;
GRANT SELECT, INSERT, DELETE ON public.request_documents TO authenticated;
DROP POLICY IF EXISTS request_documents_select ON public.request_documents;
CREATE POLICY request_documents_select ON public.request_documents FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.service_requests r WHERE r.id = request_id AND r.organization_id IN (SELECT private.current_organization_ids())));
DROP POLICY IF EXISTS request_documents_write ON public.request_documents;
CREATE POLICY request_documents_write ON public.request_documents FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.service_requests r WHERE r.id = request_id AND private.has_organization_role(r.organization_id, ARRAY['admin','operator','member'])));
DROP POLICY IF EXISTS request_documents_delete ON public.request_documents;
CREATE POLICY request_documents_delete ON public.request_documents FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.service_requests r WHERE r.id = request_id AND private.has_organization_role(r.organization_id, ARRAY['admin','operator'])));

ALTER TABLE public.identity_documents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.identity_documents FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.identity_documents TO authenticated;
DROP POLICY IF EXISTS identity_documents_tenant_select ON public.identity_documents;
CREATE POLICY identity_documents_tenant_select ON public.identity_documents FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.citizens c WHERE c.id = citizen_id AND c.organization_id IN (SELECT private.current_organization_ids())));
DROP POLICY IF EXISTS identity_documents_tenant_write ON public.identity_documents;
CREATE POLICY identity_documents_tenant_write ON public.identity_documents FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.citizens c WHERE c.id = citizen_id AND private.has_organization_role(c.organization_id, ARRAY['admin','operator'])));
DROP POLICY IF EXISTS identity_documents_tenant_update ON public.identity_documents;
CREATE POLICY identity_documents_tenant_update ON public.identity_documents FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.citizens c WHERE c.id = citizen_id AND private.has_organization_role(c.organization_id, ARRAY['admin','operator'])));
DROP POLICY IF EXISTS identity_documents_tenant_delete ON public.identity_documents;
CREATE POLICY identity_documents_tenant_delete ON public.identity_documents FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.citizens c WHERE c.id = citizen_id AND private.has_organization_role(c.organization_id, ARRAY['admin'])));

CREATE OR REPLACE FUNCTION public.machine_connect_advanced_touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['departments','citizens','service_requests','workflows','documents','spatial_assets','form_schemas','form_records'] LOOP EXECUTE format('DROP TRIGGER IF EXISTS advanced_touch_updated_at ON public.%I',t); EXECUTE format('CREATE TRIGGER advanced_touch_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.machine_connect_advanced_touch_updated_at()',t); END LOOP; END $$;

-- Realtime for low-volume operational records. High-volume telemetry remains on the existing event path.
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.workflow_tasks; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.land_parcels; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
