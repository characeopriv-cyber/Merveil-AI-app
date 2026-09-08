-- Intelligence job queue for controlled document/connector/graph processing.
CREATE TABLE IF NOT EXISTS public.machine_connect_intelligence_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  document_id uuid REFERENCES public.ontology_documents(id) ON DELETE SET NULL,
  connector_id uuid REFERENCES public.machine_connect_connector_instances(id) ON DELETE SET NULL,
  job_type text NOT NULL CHECK (job_type IN ('document_extract','connector_sync','graph_refresh')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','completed','failed','cancelled')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0 AND attempts <= 10),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payload)='object'),
  result jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(result)='object'),
  error text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mc_intel_jobs_queue ON public.machine_connect_intelligence_jobs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_mc_intel_jobs_org ON public.machine_connect_intelligence_jobs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mc_intel_jobs_document ON public.machine_connect_intelligence_jobs(document_id);
CREATE INDEX IF NOT EXISTS idx_mc_intel_jobs_connector ON public.machine_connect_intelligence_jobs(connector_id);
ALTER TABLE public.machine_connect_intelligence_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mc_intel_jobs_select_member ON public.machine_connect_intelligence_jobs;
CREATE POLICY mc_intel_jobs_select_member ON public.machine_connect_intelligence_jobs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.organization_members om WHERE om.organization_id=machine_connect_intelligence_jobs.organization_id AND om.user_id=auth.uid()));
DROP POLICY IF EXISTS mc_intel_jobs_insert_member ON public.machine_connect_intelligence_jobs;
CREATE POLICY mc_intel_jobs_insert_member ON public.machine_connect_intelligence_jobs FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.organization_members om WHERE om.organization_id=machine_connect_intelligence_jobs.organization_id AND om.user_id=auth.uid()));
DROP POLICY IF EXISTS mc_intel_jobs_update_owner_admin ON public.machine_connect_intelligence_jobs;
CREATE POLICY mc_intel_jobs_update_owner_admin ON public.machine_connect_intelligence_jobs FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.organization_members om WHERE om.organization_id=machine_connect_intelligence_jobs.organization_id AND om.user_id=auth.uid() AND om.role IN ('owner','admin'))) WITH CHECK (EXISTS (SELECT 1 FROM public.organization_members om WHERE om.organization_id=machine_connect_intelligence_jobs.organization_id AND om.user_id=auth.uid() AND om.role IN ('owner','admin')));
