-- Wavelength — "the category cannot be changed after question creation"
-- (approved product rule). Phase 4 is the first phase to build the actual
-- edit flow, and RLS alone doesn't express this: questions_update only
-- checks ownership + DRAFT state, so without this trigger a manipulated
-- client could still UPDATE a question's category directly via the REST
-- API even though the UI never offers to. Consistent with this project's
-- standing rule that the database — not app-layer omission — is what
-- actually enforces a product rule.
create or replace function enforce_question_category_immutable()
returns trigger
language plpgsql
as $$
begin
  if new.category is distinct from old.category then
    raise exception 'a question''s category cannot be changed after creation';
  end if;
  return new;
end;
$$;

create trigger questions_category_immutable
  before update on questions
  for each row execute function enforce_question_category_immutable();
