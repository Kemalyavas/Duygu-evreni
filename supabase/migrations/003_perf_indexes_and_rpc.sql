-- ============================================================================
-- 003_perf_indexes_and_rpc.sql
--
-- PROPOSED — apply together with the performance deploy. All statements are
-- additive and safe (indexes + one read-only function); they can be applied at
-- any time without an app change. The app degrades gracefully if not applied
-- (useStarCounts falls back to per-planet counts).
-- ============================================================================

-- Indexes for the hot read paths (filters/orders the client issues today)
create index if not exists idx_stars_planet_created
  on public.stars (planet_id, created_at desc);
create index if not exists idx_messages_conversation_created
  on public.messages (conversation_id, created_at);
create index if not exists idx_notifications_user_created
  on public.notifications (user_id, created_at desc);
create index if not exists idx_conversations_initiator
  on public.conversations (initiator_id);
create index if not exists idx_conversations_star_owner
  on public.conversations (star_owner_id);
create index if not exists idx_blocked_users_blocked
  on public.blocked_users (blocked_id);
create index if not exists idx_user_ip_history_user
  on public.user_ip_history (user_id);

-- Single grouped star-count query — replaces the 11 round-trips / 10 COUNT(*)
-- scans that useStarCounts fires on every homepage load.
create or replace function public.get_planet_star_counts()
returns table(planet_id uuid, count bigint)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select planet_id, count(*) as count
  from public.stars
  group by planet_id
$$;

grant execute on function public.get_planet_star_counts() to anon, authenticated;
