-- Machine Connect retry worker claim metadata
-- Atomic retry claims prevent duplicate dispatch attempts across workers.

alter table public.machine_connect_commands
  add column if not exists retry_claimed_at timestamptz null;

create index if not exists machine_connect_commands_retry_claim_idx
  on public.machine_connect_commands (organization_id, status, timeout_at, retry_claimed_at)
  where status = 'dispatched';
