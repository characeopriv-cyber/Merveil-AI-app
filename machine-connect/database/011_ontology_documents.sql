-- Repository record of the production ontology_documents schema.
-- Production migration was applied and verified separately.
create table if not exists public.ontology_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  byte_size bigint not null default 0 check (byte_size >= 0),
  status text not null default 'queued' check (status in ('queued','processing','completed','failed')),
  extracted_text text,
  extraction_error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
