-- Merveil AI notification system v2
-- Applied to Supabase production as migration: merveil_notifications_v2
-- Covers in-app notifications, unread state, event-driven creation, and push webhook payloads.

alter table public.merveil_notification_events
  add column if not exists title text,
  add column if not exists body text,
  add column if not exists action_url text,
  add column if not exists read_at timestamptz,
  add column if not exists expires_at timestamptz,
  add column if not exists dedupe_key text;

create index if not exists merveil_notification_events_user_created_idx on public.merveil_notification_events (user_id, created_at desc);
create index if not exists merveil_notification_events_user_unread_idx on public.merveil_notification_events (user_id, created_at desc) where read_at is null;
create unique index if not exists merveil_notification_events_user_dedupe_idx on public.merveil_notification_events (user_id, dedupe_key) where dedupe_key is not null;

alter table public.merveil_notification_events enable row level security;

drop policy if exists merveil_notification_events_select_own on public.merveil_notification_events;
drop policy if exists merveil_notification_events_update_own on public.merveil_notification_events;
drop policy if exists merveil_notification_events_delete_own on public.merveil_notification_events;
create policy merveil_notification_events_select_own on public.merveil_notification_events for select to authenticated using (auth.uid() = user_id);
create policy merveil_notification_events_update_own on public.merveil_notification_events for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy merveil_notification_events_delete_own on public.merveil_notification_events for delete to authenticated using (auth.uid() = user_id);

-- Notification creation is server/trigger controlled; clients only read/update/delete their own events.
create or replace function public.merveil_create_notification(
  p_user_id uuid, p_event_type text, p_title text, p_body text default null,
  p_payload jsonb default '{}'::jsonb, p_priority text default 'normal',
  p_action_url text default null, p_dedupe_key text default null
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
  if p_user_id is null then return null; end if;
  if p_dedupe_key is not null then
    select id into v_id from public.merveil_notification_events where user_id=p_user_id and dedupe_key=p_dedupe_key limit 1;
    if v_id is not null then return v_id; end if;
  end if;
  insert into public.merveil_notification_events
    (user_id, channel, event_type, priority, payload, provider, status, title, body, action_url, dedupe_key)
  values
    (p_user_id, 'in_app', p_event_type, coalesce(p_priority,'normal'), coalesce(p_payload,'{}'::jsonb), 'merveil', 'queued', p_title, p_body, p_action_url, p_dedupe_key)
  returning id into v_id;
  return v_id;
end; $$;

revoke all on function public.merveil_create_notification(uuid,text,text,text,jsonb,text,text,text) from public, anon, authenticated;

-- Event triggers are intentionally limited to citizen-facing Merveil activity.
-- Messages remain application-controlled because E2EE content must never enter notification payloads.
