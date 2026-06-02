-- ============================================================================
-- 004_profiles_pii_column_revoke.sql
--
-- H2 (partial) — stop logged-in (`authenticated`) users from reading other
-- users' PII via PostgREST.
--
-- Context: migration 002 section H1 already locked the `anon` role down to
-- (id, username, show_username_in_chats). But `authenticated` still held SELECT
-- on EVERY column, so ANY logged-in user could run
--     GET /rest/v1/profiles?select=email,last_ip
-- and dump every user's email + last IP — fatal de-anonymization for an
-- anonymity app.
--
-- Fix: restrict `authenticated` to the non-PII columns the client actually
-- reads. PostgreSQL note: a column-only REVOKE is a no-op while a TABLE-level
-- SELECT grant exists (the table grant implies all columns). So we REVOKE the
-- table-level grant first, then GRANT back only the allowed columns — the same
-- pattern H1 used for `anon`.
--
-- The 12 granted columns below MUST stay in sync with
-- `PROFILE_SELECT_COLUMNS` in types/index.ts. Excluded (now unreadable by
-- non-service roles): email, last_ip, last_ip_updated_at.
--
-- ⚠️ DEPLOY ORDERING: ship the app change that replaces bare `select=*` on
--    profiles with PROFILE_SELECT_COLUMNS FIRST, then apply this. A `select=*`
--    request would otherwise 403 ("permission denied for column profiles.email").
--    (Done in the commit that adds PROFILE_SELECT_COLUMNS.)
--
-- service_role is untouched: /api/ip/track (writes last_ip) and the admin
-- routes keep full column access.
--
-- RESIDUAL (NOT closed here): `authenticated` can still read is_admin /
-- is_banned / banned_reason / banned_at on OTHER users' rows (boolean/text
-- flags, lower severity than email/IP). Full closure needs a `public_profiles`
-- view + self-only SELECT policy + repointed PostgREST embeds, which require an
-- authenticated-session test pass. Tracked as H2-full in
-- 002_security_hardening.sql section H.
-- ============================================================================

revoke select on public.profiles from authenticated;
grant select (
  id,
  username,
  show_username_in_chats,
  is_admin,
  is_banned,
  banned_reason,
  banned_at,
  daily_stars_added,
  daily_views_used,
  daily_message_requests_sent,
  last_reset_date,
  created_at
) on public.profiles to authenticated;
