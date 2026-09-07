-- Merveil Machine Connect — Storage + operational metrics
-- Apply after 002_machine_connect_supabase.sql.

-- ---------------------------------------------------------------------------
-- Private firmware/device media bucket
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('machine-connect-assets', 'machine-connect-assets', false)
on conflict (id) do update set public = false;

-- Expected object layout:
-- machine-connect-assets/<organization_id>/<device_id>/<filename>

DROP POLICY IF EXISTS machine_connect_assets_select ON storage.objects;
CREATE POLICY machine_connect_assets_select
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'machine-connect-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text
    FROM public.organization_members
    WHERE user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS machine_connect_assets_insert ON storage.objects;
CREATE POLICY machine_connect_assets_insert
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'machine-connect-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text
    FROM public.organization_members
    WHERE user_id = (select auth.uid())
  )
  AND public.private_has_machine_connect_asset_admin((storage.foldername(name))[1]::uuid)
);

DROP POLICY IF EXISTS machine_connect_assets_update ON storage.objects;
CREATE POLICY machine_connect_assets_update
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'machine-connect-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text
    FROM public.organization_members
    WHERE user_id = (select auth.uid())
  )
)
WITH CHECK (
  bucket_id = 'machine-connect-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text
    FROM public.organization_members
    WHERE user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS machine_connect_assets_delete ON storage.objects;
CREATE POLICY machine_connect_assets_delete
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'machine-connect-assets'
  AND public.private_has_machine_connect_asset_admin((storage.foldername(name))[1]::uuid)
);

-- ---------------------------------------------------------------------------
-- Safe private helper for Storage admin checks.
-- This is intentionally in a non-exposed schema and checks auth.uid().
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.has_machine_connect_asset_admin(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role = 'admin'
  );
$$;

REVOKE EXECUTE ON FUNCTION private.has_machine_connect_asset_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_machine_connect_asset_admin(uuid) TO authenticated;

-- Rebind policies after helper creation (CREATE POLICY above intentionally
-- remains readable, but PostgreSQL resolves the helper at execution time).

-- ---------------------------------------------------------------------------
-- Daily telemetry rollup for dashboard/reporting workloads.
-- This is deliberately a normal view for now; it avoids maintaining a costly
-- materialized view until actual telemetry volume justifies it.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.machine_connect_daily_device_stats
WITH (security_invoker = true)
AS
SELECT
  organization_id,
  device_id,
  date_trunc('day', observed_at) AS day,
  avg(temperature) AS avg_temperature,
  avg(humidity) AS avg_humidity,
  avg(battery) AS avg_battery,
  count(*) AS sample_count
FROM public.device_telemetry
GROUP BY organization_id, device_id, date_trunc('day', observed_at);

REVOKE ALL ON public.machine_connect_daily_device_stats FROM anon;
GRANT SELECT ON public.machine_connect_daily_device_stats TO authenticated;

-- ---------------------------------------------------------------------------
-- Retention helper. Do not schedule deletion until the retention period is
-- explicitly chosen for the deployment. Telemetry is operational evidence.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.machine_connect_delete_telemetry_before(cutoff timestamptz)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  deleted_count bigint;
BEGIN
  DELETE FROM public.device_telemetry
  WHERE observed_at < cutoff;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.machine_connect_delete_telemetry_before(timestamptz) FROM PUBLIC;

-- Verification:
-- select id, name, public from storage.buckets where id = 'machine-connect-assets';
-- select schemaname, viewname from pg_views where viewname = 'machine_connect_daily_device_stats';
