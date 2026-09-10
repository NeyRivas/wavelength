-- Wavelength — bug-fix pass: refine questions_invalidate_answers_on_edit.
--
-- Previous behavior (20260907120000): ANY change to `options` cleared the
-- answer unconditionally, even when the previously-selected option's exact
-- text was still present (e.g. adding a new option, or editing a
-- *different*, non-selected option's text). Confirmed product requirement
-- now: an answer should only be cleared when it is actually no longer
-- valid for the edited question — not on every incidental options change.
--
-- Refined rule:
--   * Question text change -> always clear (a re-worded question is a
--     different question, regardless of whether the stored value would
--     still "fit" mechanically).
--   * Type change (choice <-> scale) -> always clear (the answer's domain
--     itself no longer applies).
--   * Options change (Choice only — Scale's options is always null): for
--     each existing answer, look up the exact option TEXT the stored index
--     pointed to under the OLD options. If that exact text still exists
--     somewhere in the NEW options, the answer is preserved and re-indexed
--     to that text's new position (handles an earlier option being
--     removed, which shifts later indices down); otherwise the answer is
--     cleared, because the option it referred to no longer exists.
create or replace function invalidate_answers_on_question_edit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ans record;
  selected_text text;
  new_index int;
begin
  if new.type is distinct from old.type then
    delete from answers where question_id = old.id;
    return new;
  end if;

  if new.text is distinct from old.text then
    delete from answers where question_id = old.id;
    return new;
  end if;

  if new.options is distinct from old.options then
    for ans in select id, value from answers where question_id = old.id loop
      selected_text := old.options ->> (ans.value #>> '{}')::int;

      select (ord - 1) into new_index
        from jsonb_array_elements_text(new.options) with ordinality as t(opt, ord)
        where opt = selected_text
        limit 1;

      if new_index is null then
        delete from answers where id = ans.id;
      else
        update answers set value = to_jsonb(new_index) where id = ans.id;
      end if;
    end loop;
  end if;

  return new;
end;
$$;
