-- ============================================================================
-- 007_perf_fk_indexes_and_rls_initplan.sql
--
-- APPLIED 2026-06-04 via Supabase MCP (recorded here for repo↔DB parity).
-- Resolves Supabase performance advisors found during the messaging audit:
--   * 0001 unindexed_foreign_keys  -> add covering indexes
--   * 0009 duplicate_index         -> drop the duplicate on blocked_users
--   * 0003 auth_rls_initplan       -> wrap auth.uid() in (select auth.uid())
--                                     so it is evaluated once per query, not per row
-- All changes are behaviour-preserving (RLS semantics identical, verified that
-- anon stays blocked after the policy rewrites).
-- ============================================================================

-- 0009: drop the duplicate index (identical to idx_blocked_users_blocked)
drop index if exists public.idx_blocked_blocked;

-- 0001: covering indexes for unindexed foreign keys
create index if not exists idx_banned_ips_banned_by      on public.banned_ips (banned_by);
create index if not exists idx_conv_nicknames_user        on public.conversation_nicknames (user_id);
create index if not exists idx_notifications_conversation on public.notifications (conversation_id);
create index if not exists idx_notifications_sender       on public.notifications (sender_id);
create index if not exists idx_reports_conversation       on public.reports (conversation_id);
create index if not exists idx_reports_reported_user      on public.reports (reported_user_id);

-- 0003: initplan-optimize every RLS policy that used a bare auth.uid().
alter policy "Users can view own conversations" on public.conversations
  using (((select auth.uid()) = initiator_id) or ((select auth.uid()) = star_owner_id));
alter policy "Participants can update conversation" on public.conversations
  using (((select auth.uid()) = initiator_id) or ((select auth.uid()) = star_owner_id));
alter policy "Users can create conversation requests" on public.conversations
  with check (((select auth.uid()) = initiator_id) and ((select auth.uid()) <> star_owner_id));

alter policy "Conversation members can view messages" on public.messages
  using (exists (select 1 from conversations c
    where c.id = messages.conversation_id
      and (c.initiator_id = (select auth.uid()) or c.star_owner_id = (select auth.uid()))
      and c.status = 'accepted'::text));
alter policy "Users can send messages to accepted conversations" on public.messages
  with check (sender_id = (select auth.uid()) and exists (select 1 from conversations c
    where c.id = messages.conversation_id
      and (c.initiator_id = (select auth.uid()) or c.star_owner_id = (select auth.uid()))
      and c.status = 'accepted'::text));
alter policy "Recipients can mark messages as read" on public.messages
  using (sender_id <> (select auth.uid()) and exists (select 1 from conversations c
    where c.id = messages.conversation_id
      and (c.initiator_id = (select auth.uid()) or c.star_owner_id = (select auth.uid()))));

alter policy "Users can view own notifications" on public.notifications using ((select auth.uid()) = user_id);
alter policy "Users can update own notifications" on public.notifications using ((select auth.uid()) = user_id);
alter policy "Users can delete own notifications" on public.notifications using ((select auth.uid()) = user_id);

alter policy "Users can view own blocks" on public.blocked_users using (blocker_id = (select auth.uid()));
alter policy "Users can block others" on public.blocked_users with check (blocker_id = (select auth.uid()) and blocker_id <> blocked_id);
alter policy "Users can unblock" on public.blocked_users using (blocker_id = (select auth.uid()));

alter policy "Users can view own reports" on public.reports using (reporter_id = (select auth.uid()));
alter policy "Users can create reports" on public.reports with check (reporter_id = (select auth.uid()) and reporter_id <> reported_user_id);

alter policy "Users can view own nicknames" on public.conversation_nicknames using (user_id = (select auth.uid()));
alter policy "Users can insert own nicknames" on public.conversation_nicknames with check (user_id = (select auth.uid()));
alter policy "Users can update own nicknames" on public.conversation_nicknames using (user_id = (select auth.uid()));
alter policy "Users can delete own nicknames" on public.conversation_nicknames using (user_id = (select auth.uid()));

alter policy "Users can view own IP history" on public.user_ip_history using (user_id = (select auth.uid()));
alter policy "Users can insert own IP history" on public.user_ip_history with check (user_id = (select auth.uid()));
alter policy "Users can update own IP history" on public.user_ip_history
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

alter policy "Only admins can manage banned_ips" on public.banned_ips
  using (exists (select 1 from profiles where profiles.id = (select auth.uid()) and profiles.is_admin = true));
