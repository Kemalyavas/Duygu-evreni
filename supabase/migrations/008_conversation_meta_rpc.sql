-- ============================================================================
-- 008_conversation_meta_rpc.sql
--
-- APPLIED 2026-06-04 via Supabase MCP (recorded here for repo↔DB parity).
-- Powers the chat list's last-message preview + unread badge, which were
-- rendered by ConversationList but never populated (fetchConversations did not
-- fetch them). Returns both for the caller's conversations in ONE round-trip.
--
-- SECURITY INVOKER → the messages RLS still applies (the caller is a member of
-- these conversations) and (select auth.uid()) identifies them for the unread
-- filter. Used by useConversations.fetchConversations.
-- ============================================================================
create or replace function public.get_conversation_meta(p_conv_ids uuid[])
returns table (
  conversation_id uuid,
  last_content text,
  last_at timestamptz,
  unread_count bigint
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select m.conversation_id,
         (array_agg(m.content order by m.created_at desc))[1] as last_content,
         max(m.created_at) as last_at,
         count(*) filter (where m.sender_id <> (select auth.uid()) and m.is_read = false) as unread_count
  from public.messages m
  where m.conversation_id = any(p_conv_ids)
  group by m.conversation_id;
$$;

revoke all on function public.get_conversation_meta(uuid[]) from public;
grant execute on function public.get_conversation_meta(uuid[]) to authenticated;
