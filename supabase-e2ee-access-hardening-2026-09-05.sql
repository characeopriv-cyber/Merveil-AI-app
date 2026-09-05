-- Merveil E2EE access hardening — 2026-09-05
-- Applied to production Supabase project.
-- This migration hardens the E2EE key/session tables only.
-- It does NOT certify end-to-end encryption by itself.

begin;

alter table public.merveil_e2ee_devices enable row level security;
alter table public.merveil_e2ee_devices force row level security;

drop policy if exists "e2ee devices select active public keys" on public.merveil_e2ee_devices;
drop policy if exists "e2ee devices insert own" on public.merveil_e2ee_devices;
drop policy if exists "e2ee devices update own" on public.merveil_e2ee_devices;
drop policy if exists "e2ee devices delete own" on public.merveil_e2ee_devices;

create policy "e2ee devices select active public keys"
  on public.merveil_e2ee_devices for select to authenticated
  using (revoked_at is null);

create policy "e2ee devices insert own"
  on public.merveil_e2ee_devices for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "e2ee devices update own"
  on public.merveil_e2ee_devices for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "e2ee devices delete own"
  on public.merveil_e2ee_devices for delete to authenticated
  using ((select auth.uid()) = user_id);

alter table public.merveil_e2ee_conversations enable row level security;
alter table public.merveil_e2ee_conversations force row level security;

drop policy if exists "e2ee conversations participant read" on public.merveil_e2ee_conversations;
create policy "e2ee conversations participant read"
  on public.merveil_e2ee_conversations for select to authenticated
  using (exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (select auth.uid()) = any(c.participant_ids)
  ));

create index if not exists idx_merveil_e2ee_devices_user_active
  on public.merveil_e2ee_devices(user_id) where revoked_at is null;
create index if not exists idx_merveil_e2ee_devices_device_id
  on public.merveil_e2ee_devices(device_id);

revoke all on public.merveil_e2ee_devices from anon;
revoke all on public.merveil_e2ee_conversations from anon;

commit;
