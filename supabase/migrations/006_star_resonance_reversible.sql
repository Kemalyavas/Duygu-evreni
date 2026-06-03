-- ============================================================================
-- 006_star_resonance_reversible.sql
--
-- Makes the heart / resonance REVERSIBLE. Previously un-hearting never
-- decremented the public count, so a star stayed in "Öne Çıkanlar" forever
-- (even after the user removed their like). Now the heart is a true toggle:
-- ON = +1 (handled by 005's increment_star_resonance), OFF = -1 (this RPC).
--
-- Also resets the orphaned counts left over from the old one-way behavior so
-- the reversible logic starts from a clean slate (feature is new / low usage).
-- ============================================================================

-- Clear stuck/orphaned counts from the old one-way logic.
update public.stars set resonance_count = 0 where resonance_count <> 0;

-- Anonymous decrement, floored at 0. Mirrors increment_star_resonance (005):
-- SECURITY DEFINER so anon/authenticated can adjust the counter WITHOUT holding
-- UPDATE on stars; client write paths stay closed.
create or replace function public.decrement_star_resonance(p_star_id uuid)
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
    set resonance_count = greatest(0, resonance_count - 1)
    where id = p_star_id
    returning resonance_count into v_new_count;
  return v_new_count; -- NULL if the star does not exist
end;
$$;

-- 002_security_hardening.sql revokes blanket RPC EXECUTE; re-grant explicitly.
revoke all on function public.decrement_star_resonance(uuid) from public;
grant execute on function public.decrement_star_resonance(uuid) to anon, authenticated;
