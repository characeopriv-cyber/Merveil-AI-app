-- Machine Connect delivery lifecycle hardening
-- Durable ACK/timeout/retry metadata for command delivery.

alter table public.machine_connect_commands
  add column if not exists dispatched_at timestamptz null,
  add column if not exists acknowledged_at timestamptz null,
  add column if not exists timeout_at timestamptz null,
  add column if not exists attempt_count integer not null default 0,
  add column if not exists max_attempts integer not null default 3,
  add column if not exists next_retry_at timestamptz null,
  add column if not exists last_error text null,
  add column if not exists adapter_id text null;

create index if not exists machine_connect_commands_retry_idx
  on public.machine_connect_commands (organization_id, status, next_retry_at)
  where status in ('dispatched','timed_out','failed');
