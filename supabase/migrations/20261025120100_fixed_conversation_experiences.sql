-- Wavelength — fixed conversation experiences ("36 Questions to Fall in
-- Love", lib/wavelength/conversation-experiences.ts).
--
-- Not a parallel system: a conversation experience is still one ordinary
-- `wavelengths` row (same DRAFT -> WAITING -> IN_PROGRESS -> COMPLETED
-- state machine, same share token, same claim/submit RPCs, same RLS on
-- questions and answers) with its questions seeded once from a fixed list.
-- This migration adds only what that needs and the existing schema
-- couldn't express:
--
--   1. `wavelengths.fixed_question_count` — null for every existing and
--      every "Make Your Own"/ready-made draft (all unchanged). When set,
--      the draft's question set is fixed: exactly that many questions,
--      inserted once, never edited, deleted, reordered, or added to. This
--      is a self-restriction set by A at insert time (the existing
--      wavelengths_insert policy already lets A insert their own row), and
--      immutable afterwards.
--   2. `open` questions (added in 20261025120000) carry no options and
--      are answered with written text, stored as a JSON string in the
--      existing `answers.value` jsonb column. They are only allowed in a
--      fixed experience, so the existing scored result screens can never
--      receive one.
--
-- Answer privacy is untouched: answers_select still only lets each
-- participant read their own rows until the wavelength is COMPLETED.

-- ── 1. the fixed-set marker ───────────────────────────────────────────────
alter table wavelengths add column fixed_question_count smallint;

alter table wavelengths add constraint wavelengths_fixed_question_count_range check (
  fixed_question_count is null or fixed_question_count between 5 and 50
);

-- ── 2. options shape: `open`, like `scale`, never has options ─────────────
alter table questions drop constraint questions_options_shape;

alter table questions add constraint questions_options_shape check (
  (type in ('scale', 'open') and options is null)
  or (
    type = 'choice'
    and options is not null
    and jsonb_typeof(options) = 'array'
    and jsonb_array_length(options) between 2 and 5
  )
);

create or replace function validate_question_options()
returns trigger
language plpgsql
as $$
declare
  v_option jsonb;
  v_text text;
begin
  if new.type::text <> 'choice' then
    return new; -- shape already guarantees options is null
  end if;

  for v_option in select * from jsonb_array_elements(new.options)
  loop
    if jsonb_typeof(v_option) <> 'string' then
      raise exception 'each option must be a JSON string';
    end if;
    v_text := btrim(v_option #>> '{}');
    if char_length(v_text) < 1 or char_length(v_text) > 200 then
      raise exception 'each option must be 1-200 characters';
    end if;
  end loop;

  return new;
end;
$$;

-- ── 3. answer values: written text for `open` ─────────────────────────────
-- choice/scale validation is identical to 20260906120000. An `open`
-- answer is a JSON string of 1-2000 characters after trimming, with no
-- control characters other than tab/newline/carriage return.
create or replace function validate_answer_value()
returns trigger
language plpgsql
as $$
declare
  v_type text;
  v_options jsonb;
  v_index int;
  v_scale int;
  v_text text;
begin
  select type::text, options into v_type, v_options
    from questions
   where id = new.question_id
     and wavelength_id = new.wavelength_id;

  if not found then
    raise exception 'question % does not belong to wavelength %', new.question_id, new.wavelength_id;
  end if;

  if v_type = 'open' then
    if jsonb_typeof(new.value) <> 'string' then
      raise exception 'an open answer must be a JSON string';
    end if;
    v_text := btrim(new.value #>> '{}', E' \t\r\n');
    if char_length(v_text) < 1 or char_length(v_text) > 2000 then
      raise exception 'an answer must be 1-2000 characters';
    end if;
    if (new.value #>> '{}') ~ '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]' then
      raise exception 'an answer cannot contain control characters';
    end if;
    return new;
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

-- ── 4. question count cap: 12, or exactly the fixed count ─────────────────
-- SECURITY DEFINER for a reliable read of the parent row and the full
-- question count (same reasoning as
-- 20260910130000_category_immutable_check_is_security_definer.sql) — the
-- questions_insert RLS policy still decides independently whether the
-- caller may insert at all. Unchanged for every standard draft: at most
-- 12 questions, and never an `open` one.
create or replace function enforce_max_questions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_fixed smallint;
begin
  select fixed_question_count into v_fixed from wavelengths where id = new.wavelength_id;
  select count(*) into v_count from questions where wavelength_id = new.wavelength_id;

  if v_fixed is null then
    if new.type::text = 'open' then
      raise exception 'open questions are only available in fixed conversation experiences';
    end if;
    if v_count >= 12 then
      raise exception 'a Wavelength can have at most 12 questions';
    end if;
  elsif v_count >= v_fixed then
    raise exception 'this experience has a fixed set of % questions', v_fixed;
  end if;

  return new;
end;
$$;

-- ── 5. a fixed question set is immutable ─────────────────────────────────
-- Blocks every UPDATE (text, options, category, type, order_index — so
-- reorder_questions too) and DELETE on a fixed experience's questions,
-- independently of RLS (which would otherwise allow A to edit while
-- DRAFT). Also stops a standard question from being switched to `open`.
-- A cascade delete of the parent wavelength still works: by then the
-- parent row is gone, so v_fixed is null.
create or replace function enforce_fixed_question_set()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fixed smallint;
begin
  select fixed_question_count into v_fixed from wavelengths where id = old.wavelength_id;

  if v_fixed is not null then
    raise exception 'this experience''s questions are fixed and cannot be edited, removed, or reordered';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  if new.type::text = 'open' then
    raise exception 'open questions are only available in fixed conversation experiences';
  end if;

  return new;
end;
$$;

create trigger questions_enforce_fixed_set
  before update or delete on questions
  for each row execute function enforce_fixed_question_set();

-- ── 6. state machine: exact count for a fixed experience ─────────────────
-- Identical to 20260906120000's version except (a) fixed_question_count
-- can never change after insert, and (b) DRAFT -> WAITING for a fixed
-- experience requires exactly fixed_question_count questions instead of
-- the 5-12 range.
create or replace function enforce_wavelength_transition()
returns trigger
language plpgsql
as $$
declare
  v_question_count int;
  v_answered_count int;
begin
  if new.fixed_question_count is distinct from old.fixed_question_count then
    raise exception 'fixed_question_count cannot be changed after creation';
  end if;

  if new.state = old.state then
    return new; -- no-op (e.g. B saving progress) — no other column changes here
  end if;

  if old.state = 'DRAFT' and new.state = 'WAITING' then
    if new.participant_a_alias is null then
      raise exception 'participant A alias is required to finalize';
    end if;

    select count(*) into v_question_count from questions where wavelength_id = new.id;
    if old.fixed_question_count is not null then
      if v_question_count <> old.fixed_question_count then
        raise exception 'this experience needs all % of its questions to finalize (currently %)',
          old.fixed_question_count, v_question_count;
      end if;
    elsif v_question_count < 5 or v_question_count > 12 then
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
