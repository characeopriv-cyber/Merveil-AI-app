-- Apply after 002_machine_connect_supabase.sql and 003_machine_connect_storage_and_metrics.sql.
-- This migration is idempotent and matches the hardening applied to the connected Supabase project.

CREATE OR REPLACE FUNCTION public.machine_connect_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS organizations_touch_updated_at ON public.organizations;
CREATE TRIGGER organizations_touch_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.machine_connect_touch_updated_at();

DROP TRIGGER IF EXISTS devices_touch_updated_at ON public.devices;
CREATE TRIGGER devices_touch_updated_at
BEFORE UPDATE ON public.devices
FOR EACH ROW EXECUTE FUNCTION public.machine_connect_touch_updated_at();

DROP TRIGGER IF EXISTS rules_touch_updated_at ON public.rules;
CREATE TRIGGER rules_touch_updated_at
BEFORE UPDATE ON public.rules
FOR EACH ROW EXECUTE FUNCTION public.machine_connect_touch_updated_at();

DROP TRIGGER IF EXISTS webhooks_touch_updated_at ON public.webhooks;
CREATE TRIGGER webhooks_touch_updated_at
BEFORE UPDATE ON public.webhooks
FOR EACH ROW EXECUTE FUNCTION public.machine_connect_touch_updated_at();

DROP TRIGGER IF EXISTS device_groups_touch_updated_at ON public.device_groups;
CREATE TRIGGER device_groups_touch_updated_at
BEFORE UPDATE ON public.device_groups
FOR EACH ROW EXECUTE FUNCTION public.machine_connect_touch_updated_at();

DO $$ BEGIN
  ALTER TABLE public.organization_members
    ADD CONSTRAINT organization_members_role_check
    CHECK (role IN ('admin','operator','viewer','member'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.organizations
    ADD CONSTRAINT organizations_plan_check
    CHECK (plan IN ('free','pro','enterprise','internal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.devices
    ADD CONSTRAINT devices_status_check
    CHECK (status IN ('online','offline','connecting','idle','active','warning','critical','maintenance','locked','emergency_stop'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.device_commands
    ADD CONSTRAINT device_commands_status_check
    CHECK (status IN ('requested','authorized','approval_required','approved','dispatched','acknowledged','rejected','timed_out','failed','cancelled','emergency_stopped'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.rules
    ADD CONSTRAINT rules_trigger_type_check
    CHECK (trigger_type IN ('telemetry','schedule','event'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.webhooks
    ADD CONSTRAINT webhooks_https_check
    CHECK (url ~ '^https://');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
