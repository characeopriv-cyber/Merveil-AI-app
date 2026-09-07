-- Machine Connect command idempotency hardening
-- Guarantees one command per tenant + idempotency key across process restarts.

alter table public.machine_connect_commands
  add column if not exists idempotency_key text;

create unique index if not exists machine_connect_commands_org_idempotency_uidx
  on public.machine_connect_commands (organization_id, idempotency_key)
  where idempotency_key is not null;
