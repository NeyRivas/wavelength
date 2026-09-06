-- Wavelength — QA fix: editing a question's text or options (Choice's
-- options — Scale has none) after A has already answered it must
-- invalidate that answer, not leave a stale one silently selected/"Saved".
--
-- One trigger condition covers every way this can happen today (editing
-- the question text, editing/adding/removing an option, or a type change
-- that replaces options) without scattering invalidation logic across
-- every Server Action that can touch `text`/`options` — any current or
-- future code path that updates those columns gets this for free.
-- Deliberately does NOT fire for category/type alone (immutable / handled
-- by their own dedicated rules) or for a same-value re-save (e.g. a blur
-- with no actual edit) — only an actual change to `text` or `options`.
--
-- SECURITY DEFINER is required: there is deliberately no DELETE policy on
-- `answers` (rls_policies.sql — "answers are never individually deleted"),
-- so a plain trigger's DELETE would be silently filtered to 0 rows by RLS
-- (the same "DELETE filtered by RLS" pattern already exercised elsewhere
-- in this schema), never actually invalidating anything. Same escalation
-- pattern already used by claim_participant_b for its one necessary case.
create or replace function invalidate_answers_on_question_edit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.text is distinct from old.text or new.options is distinct from old.options then
    delete from answers where question_id = old.id;
  end if;
  return new;
end;
$$;

create trigger questions_invalidate_answers_on_edit
  after update on questions
  for each row execute function invalidate_answers_on_question_edit();
