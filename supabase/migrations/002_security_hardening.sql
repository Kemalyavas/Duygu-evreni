-- ============================================================================
-- 002_security_hardening.sql
--
-- ⚠️  PROPOSED — NOT YET APPLIED. Review every statement before running.
--
-- Closes the security gaps confirmed by an RLS audit + Supabase security
-- advisors on 2026-06-02. Apply in the Supabase SQL editor (or via migration)
-- AFTER reading the deploy-ordering notes on each section.
--
-- Sections:
--   A. Lock down direct `stars` INSERT  (MUST deploy together with the app —
--      authenticated star creation now goes through /api/stars).
--   B. Enforce user blocking on `messages` INSERT (server-side).
--   C. Restrict the over-permissive `notifications` INSERT policy.
--   D. Pin search_path on SECURITY DEFINER trigger functions.
--   E. Revoke direct RPC EXECUTE on trigger-only functions.
--   F. (manual) Enable leaked-password protection in Auth settings.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- A. STARS — force all inserts through the server (server-side moderation)
--
-- Current policy lets ANY authenticated user INSERT a star directly via
-- PostgREST with only `auth.uid() = user_id` — there is no content check, so
-- the client-side moderation is bypassable. Dropping the client INSERT policy
-- leaves RLS denying client inserts; the service-role routes /api/stars and
-- /api/stars/anonymous (which bypass RLS) become the only way to create a star,
-- and BOTH run server-side moderation.
--
-- ⚠️  DEPLOY ORDERING: ship the app change (StarCreationModal -> /api/stars,
--     already implemented) BEFORE or WITH this, or authenticated users will be
--     unable to create stars.
-- ----------------------------------------------------------------------------
drop policy if exists "Users can create their own stars" on public.stars;
-- (Intentionally NO replacement INSERT policy: only service_role may insert.)


-- ----------------------------------------------------------------------------
-- B. MESSAGES — enforce blocking server-side
--
-- The messages INSERT policy only checks conversation membership + accepted
-- status; it does NOT check blocked_users, so a blocked user can still insert
-- messages directly via PostgREST. This trigger rejects an insert when a block
-- exists in either direction.
-- ----------------------------------------------------------------------------
create or replace function public.enforce_message_block()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_other uuid;
begin
  select case when c.initiator_id = new.sender_id then c.star_owner_id
              else c.initiator_id end
    into v_other
  from public.conversations c
  where c.id = new.conversation_id;

  if v_other is not null and exists (
    select 1 from public.blocked_users b
    where (b.blocker_id = v_other     and b.blocked_id = new.sender_id)
       or (b.blocker_id = new.sender_id and b.blocked_id = v_other)
  ) then
    raise exception 'Engelleme nedeniyle mesaj gönderilemez';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_message_block on public.messages;
create trigger trg_enforce_message_block
  before insert on public.messages
  for each row execute function public.enforce_message_block();


-- ----------------------------------------------------------------------------
-- C. NOTIFICATIONS — remove the always-true INSERT policy
--
-- `System can insert notifications` uses WITH CHECK (true), letting any client
-- forge notifications for any user. The notify_* triggers are SECURITY DEFINER
-- and bypass RLS, so they keep working without this policy.
--
-- ⚠️  VERIFY after applying: trigger a message/request and confirm the recipient
--     still receives the notification. If notifications stop, the trigger owner
--     does not bypass RLS in this project — re-add a tightly scoped policy.
-- ----------------------------------------------------------------------------
drop policy if exists "System can insert notifications" on public.notifications;


-- ----------------------------------------------------------------------------
-- D. Pin search_path on SECURITY DEFINER functions (advisor 0011)
--    Prevents search_path-injection against definer-privileged functions.
-- ----------------------------------------------------------------------------
alter function public.check_daily_star_limit()                set search_path = public, pg_temp;
alter function public.handle_new_user()                       set search_path = public, pg_temp;
alter function public.notify_on_message_request()             set search_path = public, pg_temp;
alter function public.notify_on_new_message()                 set search_path = public, pg_temp;
alter function public.notify_on_request_accepted()            set search_path = public, pg_temp;
alter function public.unhide_conversation_on_new_message()    set search_path = public, pg_temp;
alter function public.update_conversation_nicknames_updated_at() set search_path = public, pg_temp;


-- ----------------------------------------------------------------------------
-- E. Revoke direct RPC EXECUTE on trigger-only functions (advisors 0028/0029)
--    These are trigger functions; they should not be callable as /rest/v1/rpc.
--    Revoking EXECUTE does not affect their use as triggers.
-- ----------------------------------------------------------------------------
revoke execute on function public.check_daily_star_limit()             from anon, authenticated;
revoke execute on function public.handle_new_user()                    from anon, authenticated;
revoke execute on function public.notify_on_message_request()          from anon, authenticated;
revoke execute on function public.notify_on_new_message()              from anon, authenticated;
revoke execute on function public.notify_on_request_accepted()         from anon, authenticated;
revoke execute on function public.unhide_conversation_on_new_message() from anon, authenticated;


-- ----------------------------------------------------------------------------
-- F. MANUAL (no SQL): In the Supabase dashboard, enable
--    Authentication → Providers → Email → "Leaked password protection"
--    (HaveIBeenPwned check). Advisor: auth_leaked_password_protection.
--
-- STILL CLIENT-SIDE ONLY after this migration (decide separately):
--   • Shadow-ban + the 5/day message-request limit (enforced only in the
--     browser in useConversations). Add a BEFORE INSERT trigger on
--     conversations if you want these enforced at the DB level too.
--   • Private DM / first-message content moderation (product/privacy decision).
-- ----------------------------------------------------------------------------
