-- ============================================================================
-- 005_star_resonance.sql
--
-- Adds a PUBLIC, ANONYMOUS "resonance" counter to stars + a guarded increment
-- RPC. Powers the heart button (save + count) and the "Öne Çıkanlar"
-- (most-resonant) discovery list.
--
-- Additive and SAFE: the column defaults to 0; the app degrades gracefully if
-- this migration is not yet applied (the heart simply shows 0 / no featured
-- list). Mirrors the conventions of 003_perf_indexes_and_rpc.sql.
-- ============================================================================

-- Public resonance counter. Readable by everyone (stars are public-read);
-- only writable through the RPC below (client UPDATE on stars stays closed).
alter table public.stars
  add column if not exists resonance_count integer not null default 0;

-- Order/discovery index for the "Öne Çıkanlar" (most-resonant) query
-- (order by resonance_count desc, filtered to > 0).
create index if not exists idx_stars_resonance
  on public.stars (resonance_count desc);

-- Anonymous, cookieless increment. SECURITY DEFINER so anon/authenticated can
-- bump the counter WITHOUT holding UPDATE on stars. Double-counting is prevented
-- client-side (one resonance per device via localStorage) — intentionally
-- lightweight for the current scale; tighten with a device-id table later if abused.
create or replace function public.increment_star_resonance(p_star_id uuid)
returns integer
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_new_count integer;
begin
  update public.stars
    set resonance_count = resonance_count + 1
    where id = p_star_id
    returning resonance_count into v_new_count;
  return v_new_count; -- NULL if the star does not exist
end;
$$;

-- 002_security_hardening.sql revokes blanket RPC EXECUTE; re-grant explicitly.
revoke all on function public.increment_star_resonance(uuid) from public;
grant execute on function public.increment_star_resonance(uuid) to anon, authenticated;
