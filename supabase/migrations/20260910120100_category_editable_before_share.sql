-- Wavelength — bug-fix pass: category editing before sharing is an
-- intentional product requirement, not a bug. The original
-- questions_category_immutable trigger (20260904120500) blocked ANY
-- category change unconditionally, even while the wavelength was still
-- DRAFT — that was wrong. Category must be freely editable up to the
-- moment A shares (same as text/options), and locked from then on, same
-- as every other question field. `questions_update`'s own RLS policy
-- already restricts the whole UPDATE to DRAFT-state wavelengths owned by
-- the caller, so this trigger's job is narrower than it used to be: reject
-- a category change specifically, but only when the wavelength is no
-- longer DRAFT (defense-in-depth alongside RLS, consistent with this
-- project's standing rule that the database enforces product rules
-- independently of what the UI offers).
create or replace function enforce_question_category_immutable()
returns trigger
language plpgsql
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
