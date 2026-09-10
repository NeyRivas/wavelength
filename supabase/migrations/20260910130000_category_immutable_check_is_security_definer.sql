-- Wavelength — bug-fix: changing a question's category while DRAFT was
-- surfacing "Something went wrong. Please try again." in the real app.
--
-- Root cause: enforce_question_category_immutable (20260910120100) added a
-- cross-table lookup (select state from wavelengths ...) but did not mark
-- the function security definer. Without it, that SELECT runs as the
-- plain `authenticated` role and is itself subject to wavelengths_select
-- RLS — an unnecessary dependency, since the actual authorization decision
-- (is this UPDATE allowed at all) is already made independently by
-- questions_update's own RLS policy; this trigger only needs a reliable
-- read of the wavelength's current state for its own internal check. If
-- that SELECT ever returns no row, `v_state` is NULL, and
-- `NULL IS DISTINCT FROM 'DRAFT'` evaluates to true — so the trigger
-- raised its exception even for a genuinely-DRAFT wavelength.
--
-- Fix: security definer + set search_path = public, the same pattern
-- already used by every other trigger/function in this schema that needs
-- a guaranteed-correct read of another table's state (claim_participant_b,
-- invalidate_answers_on_question_edit) rather than relying on the
-- caller's own RLS-scoped visibility.
create or replace function enforce_question_category_immutable()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_state wavelength_state;
begin
  if new.category is distinct from old.category then
    select state into v_state from wavelengths where id = old.wavelength_id;
    if v_state is distinct from 'DRAFT' then
      raise exception 'a question''s category cannot be changed once the Wavelength is shared';
    end if;
  end if;
  return new;
end;
$$;
