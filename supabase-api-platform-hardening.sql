-- Merveil API Platform security hardening
-- Applied to the production Supabase project before this file was committed.
-- Internal SECURITY DEFINER API functions are no longer callable through
-- the public PostgREST RPC surface by anon/authenticated clients.

REVOKE EXECUTE ON FUNCTION public.api_check_and_consume_quota(uuid,text,numeric) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.api_ensure_personal_organization(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.api_get_quota(uuid,text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.api_record_usage_meter(uuid,uuid,text,numeric,text,jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.consume_api_rate_limit(uuid,timestamptz,integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_api_usage(uuid,uuid,text,numeric,text,timestamptz,timestamptz,jsonb) FROM PUBLIC, anon, authenticated;

ALTER FUNCTION public.api_check_and_consume_quota(uuid,text,numeric) SET search_path = public;
ALTER FUNCTION public.api_ensure_personal_organization(uuid) SET search_path = public;
ALTER FUNCTION public.api_get_quota(uuid,text) SET search_path = public;
ALTER FUNCTION public.api_record_usage_meter(uuid,uuid,text,numeric,text,jsonb) SET search_path = public;
ALTER FUNCTION public.consume_api_rate_limit(uuid,timestamptz,integer) SET search_path = public;
ALTER FUNCTION public.record_api_usage(uuid,uuid,text,numeric,text,timestamptz,timestamptz,jsonb) SET search_path = public;

-- IMPORTANT: api_webhook_event_outbox and api_oauth_refresh_tokens still need
-- an explicit RLS policy decision. Do not blindly enable RLS without defining
-- the intended service-only access path first.
