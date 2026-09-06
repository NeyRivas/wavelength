-- Wavelength — MVP scope changes (product decisions, see project notes):
--   1. `situation` is removed as a question type — only `choice` and
--      `scale` remain.
--   2. `scale` answers are re-based from a 1-5 index onto the actual
--      percentage values 0/25/50/75/100 (so scoring can be a direct
--      `100 - |A - B|` instead of a lookup table — see lib/scoring/score.ts).
--   3. Question count is no longer declared upfront: `wavelengths` never
--      carries a target `question_count` or a pre-chosen `categories` list.
--      A adds questions progressively, each choosing its own category; the
--      only DB-enforced bounds are "at most 12 questions at any time" (new
--      trigger below) and "at least 5 to finalize" (updated in the existing
--      state-transition trigger).
--
-- Defensive checks first: this migration tightens two value domains
-- (question_type, scale answers) that cannot be tightened past any existing
-- incompatible row. Since this MVP has not shipped to real end users, no
-- migration path for old data is provided on purpose — if either check
-- fires, delete the offending test data and re-run.

do $$
begin
  if exists (select 1 from questions where type = 'situation') then
    raise exception
      'cannot remove situation from question_type: % existing question(s) still use it — delete them first',
      (select count(*) from questions where type = 'situation');
  end if;
end $$;

do $$
begin
  if exists (
    select 1
      from answers a
      join questions q on q.id = a.question_id
     where q.type = 'scale'
       and (a.value #>> '{}')::int not in (0, 25, 50, 75, 100)
  ) then
    raise exception
      'cannot narrow scale answers to 0/25/50/75/100: % existing scale answer(s) use the old 1-5 domain — delete them first',
      (select count(*)
         from answers a
         join questions q on q.id = a.question_id
        where q.type = 'scale'
          and (a.value #>> '{}')::int not in (0, 25, 50, 75, 100));
  end if;
end $$;

-- ── answer validation: choice-only equality branch, new scale domain ──────
-- `v_type` is deliberately `text`, not the `question_type` enum, so this
-- function has no catalog dependency on that type — otherwise the enum
-- swap below (drop + recreate) would be blocked by this function still
-- referencing it.
create or replace function validate_answer_value()
returns trigger
language plpgsql
as $$
declare
  v_type text;
  v_options jsonb;
  v_index int;
  v_scale int;
begin
  select type::text, options into v_type, v_options
    from questions
   where id = new.question_id
     and wavelength_id = new.wavelength_id;

  if not found then
    raise exception 'question % does not belong to wavelength %', new.question_id, new.wavelength_id;
  end if;

  if jsonb_typeof(new.value) <> 'number' then
    raise exception 'answer value must be a JSON number';
  end if;

  if v_type = 'choice' then
    v_index := (new.value #>> '{}')::int;
    if v_index < 0 or v_index >= jsonb_array_length(v_options) then
      raise exception 'option index % out of range for question %', v_index, new.question_id;
    end if;
  else -- scale
    v_scale := (new.value #>> '{}')::int;
    if v_scale not in (0, 25, 50, 75, 100) then
      raise exception 'scale value % out of range (must be one of 0, 25, 50, 75, 100)', v_scale;
    end if;
  end if;

  return new;
end;
$$;

-- ── question_type: drop 'situation' ────────────────────────────────────
-- Postgres has no ALTER TYPE ... DROP VALUE, so narrowing an enum means
-- swapping in a new type and renaming it into place. The existing
-- `questions_options_shape` CHECK must be dropped first — its `type = ...`
-- literals are bound to the *old* enum, and ALTER COLUMN TYPE re-validates
-- every constraint on the column against the new type, which would compare
-- question_type_new to question_type and fail with "operator does not
-- exist". It's recreated below, after the rename, bound to the new type.
alter table questions drop constraint questions_options_shape;

create type question_type_new as enum ('choice', 'scale');

alter table questions
  alter column type type question_type_new using type::text::question_type_new;

drop type question_type;
alter type question_type_new rename to question_type;

-- ── questions_options_shape: choice-only now ───────────────────────────
alter table questions add constraint questions_options_shape check (
  (type = 'scale' and options is null)
  or (
    type = 'choice'
    and options is not null
    and jsonb_typeof(options) = 'array'
    and jsonb_array_length(options) between 2 and 5
  )
);

-- ── get_wavelength_preview: drop categories/question_count from output ──
-- Return type is changing, so this needs drop + create (CREATE OR REPLACE
-- cannot change a function's result columns).
drop function get_wavelength_preview(text);

create function get_wavelength_preview(p_token text)
returns table (
  state wavelength_state,
  participant_a_alias text,
  is_taken boolean
)
language sql
security definer
stable
set search_path = public
as $$
  select w.state, w.participant_a_alias,
         (w.participant_b_id is not null) as is_taken
    from wavelengths w
   where w.share_token = p_token
     and w.state <> 'DRAFT';
$$;

revoke all on function get_wavelength_preview(text) from public;
grant execute on function get_wavelength_preview(text) to anon, authenticated;

-- ── enforce_wavelength_transition: 5-12 range instead of an exact target ─
-- Only the DRAFT -> WAITING branch changes (it used to compare against a
-- pre-declared `old.question_count`); WAITING -> IN_PROGRESS and
-- IN_PROGRESS -> COMPLETED are unchanged from functions_and_triggers.sql.
create or replace function enforce_wavelength_transition()
returns trigger
language plpgsql
as $$
declare
  v_question_count int;
  v_answered_count int;
begin
  if new.state = old.state then
    return new; -- no-op (e.g. B saving progress) — no other column changes here
  end if;

  if old.state = 'DRAFT' and new.state = 'WAITING' then
    if new.participant_a_alias is null then
      raise exception 'participant A alias is required to finalize';
    end if;

    select count(*) into v_question_count from questions where wavelength_id = new.id;
    if v_question_count < 5 or v_question_count > 12 then
      raise exception 'a Wavelength needs between 5 and 12 questions to finalize (currently %)', v_question_count;
    end if;

    select count(*) into v_answered_count
      from answers where wavelength_id = new.id and participant = 'A';
    if v_answered_count <> v_question_count then
      raise exception 'participant A has not answered all questions (%/%)', v_answered_count, v_question_count;
    end if;

    if new.waiting_at is null then
      new.waiting_at := now();
    end if;

  elsif old.state = 'WAITING' and new.state = 'IN_PROGRESS' then
    if new.participant_b_id is null then
      raise exception 'participant B must be bound before entering IN_PROGRESS';
    end if;
    if new.participant_b_alias is null then
      raise exception 'participant B alias is required to start';
    end if;

    if new.in_progress_at is null then
      new.in_progress_at := now();
    end if;

  elsif old.state = 'IN_PROGRESS' and new.state = 'COMPLETED' then
    select count(*) into v_question_count from questions where wavelength_id = new.id;
    select count(*) into v_answered_count
      from answers where wavelength_id = new.id and participant = 'B';
    if v_answered_count <> v_question_count then
      raise exception 'participant B has not answered all questions (%/%)', v_answered_count, v_question_count;
    end if;

    if new.completed_at is null then
      new.completed_at := now();
    end if;

  else
    raise exception 'invalid wavelength state transition: % -> %', old.state, new.state;
  end if;

  return new;
end;
$$;

-- ── drop the upfront question_count / categories columns ───────────────
-- No longer set at creation (progressive creation, resolved decision) —
-- the actual question count is always just `count(*) from questions`, and
-- the categories actually in play are always just `questions.category`.
alter table wavelengths drop constraint wavelengths_categories_capped_by_question_count;
alter table wavelengths drop constraint wavelengths_categories_bounds;
alter table wavelengths drop column categories;
alter table wavelengths drop column question_count;

-- ── new: hard cap of 12 questions, enforced independently of RLS ────────
-- Same "database enforces the product rule, not app-layer omission"
-- principle as enforce_question_category_immutable in the earlier
-- migration — a manipulated client could otherwise insert past 12 directly.
create or replace function enforce_max_questions()
returns trigger
language plpgsql
as $$
declare
  v_count int;
begin
  select count(*) into v_count from questions where wavelength_id = new.wavelength_id;
  if v_count >= 12 then
    raise exception 'a Wavelength can have at most 12 questions';
  end if;
  return new;
end;
$$;

create trigger questions_enforce_max_count
  before insert on questions
  for each row execute function enforce_max_questions();
