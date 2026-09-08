-- Machine Connect ontology + graph analytics hardening.
-- Production Supabase migration: ontology_graph_security_analytics_v2

ALTER TABLE public.entity_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS entity_types_read_authenticated ON public.entity_types;
CREATE POLICY entity_types_read_authenticated ON public.entity_types FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS entities_tenant_select ON public.entities;
CREATE POLICY entities_tenant_select ON public.entities FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id = entities.organization_id AND m.user_id = auth.uid()));
DROP POLICY IF EXISTS entities_tenant_insert ON public.entities;
CREATE POLICY entities_tenant_insert ON public.entities FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id = entities.organization_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin')) AND created_by = auth.uid());
DROP POLICY IF EXISTS entities_tenant_update ON public.entities;
CREATE POLICY entities_tenant_update ON public.entities FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id = entities.organization_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin'))) WITH CHECK (EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id = entities.organization_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin')));
DROP POLICY IF EXISTS entities_tenant_delete ON public.entities;
CREATE POLICY entities_tenant_delete ON public.entities FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id = entities.organization_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin')));

DROP POLICY IF EXISTS relationships_tenant_select ON public.relationships;
CREATE POLICY relationships_tenant_select ON public.relationships FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id = relationships.organization_id AND m.user_id = auth.uid()));
DROP POLICY IF EXISTS relationships_tenant_insert ON public.relationships;
CREATE POLICY relationships_tenant_insert ON public.relationships FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id = relationships.organization_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin')) AND created_by = auth.uid());
DROP POLICY IF EXISTS relationships_tenant_update ON public.relationships;
CREATE POLICY relationships_tenant_update ON public.relationships FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id = relationships.organization_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin'))) WITH CHECK (EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id = relationships.organization_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin')));
DROP POLICY IF EXISTS relationships_tenant_delete ON public.relationships;
CREATE POLICY relationships_tenant_delete ON public.relationships FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id = relationships.organization_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin')));

ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (to_tsvector('simple', coalesce(display_name,'') || ' ' || coalesce(properties->>'description',''))) STORED;
CREATE INDEX IF NOT EXISTS idx_entities_search ON public.entities USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_entities_org_updated ON public.entities (organization_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_relationships_org_source ON public.relationships (organization_id, source_entity_id);
CREATE INDEX IF NOT EXISTS idx_relationships_org_target ON public.relationships (organization_id, target_entity_id);

CREATE OR REPLACE FUNCTION public.validate_ontology_relationship() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.source_entity_id = NEW.target_entity_id THEN RAISE EXCEPTION 'Ontology relationships cannot self-reference'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.entities e WHERE e.id = NEW.source_entity_id AND e.organization_id = NEW.organization_id) THEN RAISE EXCEPTION 'Source entity is outside relationship organization'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.entities e WHERE e.id = NEW.target_entity_id AND e.organization_id = NEW.organization_id) THEN RAISE EXCEPTION 'Target entity is outside relationship organization'; END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS relationships_validate_org ON public.relationships;
CREATE TRIGGER relationships_validate_org BEFORE INSERT OR UPDATE ON public.relationships FOR EACH ROW EXECUTE FUNCTION public.validate_ontology_relationship();

CREATE OR REPLACE FUNCTION public.get_entity_graph_workspace(p_entity_id uuid, p_depth int, p_org_id uuid)
RETURNS TABLE(node_id uuid, display_name text, entity_type text, properties jsonb, depth int, source_entity_id uuid, target_entity_id uuid, relationship_type text)
LANGUAGE sql STABLE AS $$
WITH RECURSIVE graph(node_id, display_name, entity_type, properties, depth, path) AS (
  SELECT e.id, e.display_name, et.name, e.properties, 0, ARRAY[e.id]
  FROM public.entities e JOIN public.entity_types et ON et.id=e.entity_type_id
  WHERE e.id=p_entity_id AND e.organization_id=p_org_id
  UNION ALL
  SELECT n.id, n.display_name, et.name, n.properties, g.depth+1, g.path||n.id
  FROM graph g JOIN public.relationships r ON r.organization_id=p_org_id AND (r.source_entity_id=g.node_id OR r.target_entity_id=g.node_id)
  JOIN public.entities n ON n.id=CASE WHEN r.source_entity_id=g.node_id THEN r.target_entity_id ELSE r.source_entity_id END AND n.organization_id=p_org_id
  JOIN public.entity_types et ON et.id=n.entity_type_id
  WHERE g.depth < GREATEST(0, LEAST(COALESCE(p_depth,2),6)) AND NOT n.id=ANY(g.path)
), edges AS (
  SELECT DISTINCT r.source_entity_id, r.target_entity_id, r.relationship_type
  FROM public.relationships r JOIN graph g ON g.node_id IN (r.source_entity_id,r.target_entity_id)
  WHERE r.organization_id=p_org_id AND r.source_entity_id IN (SELECT node_id FROM graph) AND r.target_entity_id IN (SELECT node_id FROM graph)
)
SELECT g.node_id,g.display_name,g.entity_type,g.properties,g.depth,e.source_entity_id,e.target_entity_id,e.relationship_type
FROM graph g LEFT JOIN edges e ON e.source_entity_id=g.node_id OR e.target_entity_id=g.node_id
ORDER BY g.depth,g.display_name;
$$;

CREATE OR REPLACE FUNCTION public.find_entity_shortest_path(p_source_entity_id uuid, p_target_entity_id uuid, p_org_id uuid, p_max_depth int DEFAULT 6)
RETURNS TABLE(entity_id uuid, display_name text, entity_type text, depth int)
LANGUAGE sql STABLE AS $$
WITH RECURSIVE paths(entity_id, depth, path) AS (
  SELECT e.id,0,ARRAY[e.id] FROM public.entities e WHERE e.id=p_source_entity_id AND e.organization_id=p_org_id
  UNION ALL
  SELECT CASE WHEN r.source_entity_id=p.entity_id THEN r.target_entity_id ELSE r.source_entity_id END,p.depth+1,p.path||CASE WHEN r.source_entity_id=p.entity_id THEN r.target_entity_id ELSE r.source_entity_id END
  FROM paths p JOIN public.relationships r ON r.organization_id=p_org_id AND (r.source_entity_id=p.entity_id OR r.target_entity_id=p.entity_id)
  WHERE p.depth<GREATEST(1,LEAST(COALESCE(p_max_depth,6),10)) AND NOT (CASE WHEN r.source_entity_id=p.entity_id THEN r.target_entity_id ELSE r.source_entity_id END)=ANY(p.path)
), shortest AS (SELECT * FROM paths WHERE entity_id=p_target_entity_id ORDER BY depth LIMIT 1)
SELECT e.id,e.display_name,et.name,s.depth FROM shortest s JOIN public.entities e ON e.id=s.entity_id AND e.organization_id=p_org_id JOIN public.entity_types et ON et.id=e.entity_type_id ORDER BY s.depth;
$$;
