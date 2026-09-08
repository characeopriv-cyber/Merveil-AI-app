create table if not exists public.ontology_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  title text not null check (length(btrim(title)) between 1 and 500),
  storage_path text not null check (length(storage_path) between 1 and 2000),
  mime_type text not null check (length(mime_type) between 1 and 255),
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  status text not null default 'queued' check (status in ('queued','processing','completed','failed')),
  extracted_text text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ontology_documents_org on public.ontology_documents(organization_id);
create index if not exists idx_ontology_documents_status on public.ontology_documents(organization_id, status);

alter table public.ontology_documents enable row level security;

drop policy if exists ontology_documents_select on public.ontology_documents;
create policy ontology_documents_select on public.ontology_documents
  for select to authenticated
  using (exists (
    select 1 from public.organization_members m
    where m.organization_id = ontology_documents.organization_id
      and m.user_id = auth.uid()
  ));

drop policy if exists ontology_documents_insert on public.ontology_documents;
create policy ontology_documents_insert on public.ontology_documents
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.organization_members m
      where m.organization_id = ontology_documents.organization_id
        and m.user_id = auth.uid()
    )
  );
