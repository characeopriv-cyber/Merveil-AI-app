-- Merveil AI discovery security hardening
-- Applied to production as migration:
-- 20260902163438_harden_discovery_function_privileges_and_trigger_path

REVOKE EXECUTE ON FUNCTION public.merveil_interface_discovery(integer) FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.merveil_interface_discovery(integer) SET search_path = public;

ALTER FUNCTION public.merveil_interfaces_set_updated_at() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.merveil_interfaces_set_updated_at() FROM PUBLIC, anon, authenticated;
