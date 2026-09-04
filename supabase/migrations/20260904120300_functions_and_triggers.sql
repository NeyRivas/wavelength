-- Wavelength — integrity triggers and the three approved state-transition
-- RPCs, plus the pre-claim preview RPC (ARCHITECTURE.md §5-§6).

-- ── maintain updated_at ─────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger questions_set_updated_at
  before update on questions
  for each row execute function set_updated_at();

create trigger answers_set_updated_at
  before update on answers
  for each row execute function set_updated_at();

-- ── question option content validation ─────────────────────────────────
-- Basic shape (null vs 2-5 element array) is already a CHECK constraint on
-- the table. This trigger validates each option's *content*, which requires
-- iterating the jsonb array and so cannot be expressed as a plain CHECK.
create or replace function validate_question_options()
returns trigger
language plpgsql
as $$
declare
  v_option jsonb;
  v_text text;
begin
  if new.type = 'scale' then
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

create trigger questions_validate_options
  before insert or update on questions
  for each row execute function validate_question_options();

-- ── answer value validation ─────────────────────────────────────────────
-- Confirms `value` is shape/range-correct for the referenced question's
-- type, and that wavelength_id (denormalized) genuinely matches the
-- question's own wavelength. Requires a join to `questions`, so it cannot
-- be a plain CHECK constraint.
create or replace function validate_answer_value()
returns trigger
language plpgsql
as $$
declare
  v_type question_type;
  v_options jsonb;
  v_index int;
  v_scale int;
begin
  select type, options into v_type, v_options
    from questions
   where id = new.question_id
     and wavelength_id = new.wavelength_id;

  if not found then
    raise exception 'question % does not belong to wavelength %', new.question_id, new.wavelength_id;
  end if;

  if jsonb_typeof(new.value) <> 'number' then
    raise exception 'answer value must be a JSON number';
  end if;

  if v_type in ('choice', 'situation') then
    v_index := (new.value #>> '{}')::int;
    if v_index < 0 or v_index >= jsonb_array_length(v_options) then
      raise exception 'option index % out of range for question %', v_index, new.question_id;
    end if;
  else -- scale
    v_scale := (new.value #>> '{}')::int;
    if v_scale < 1 or v_scale > 5 then
      raise exception 'scale value % out of range (must be 1-5)', v_scale;
    end if;
  end if;

  return new;
end;
$$;

create trigger answers_validate_value
  before insert or update on answers
  for each row execute function validate_answer_value();

-- ── state machine enforcement (ARCHITECTURE.md §6) ─────────────────────
-- Defense-in-depth: independently re-validates both the transition edge
-- AND the business precondition for it ("all questions answered"), so that
-- even a bug in one of the RPCs below (or a future code path that updates
-- `wavelengths` directly) cannot produce an illegal or premature transition.
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
    if v_question_count <> old.question_count then
      raise exception 'question count mismatch: expected %, found %', old.question_count, v_question_count;
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

create trigger wavelengths_state_transition
  before update on wavelengths
  for each row execute function enforce_wavelength_transition();

-- ── RPC: pre-claim preview ──────────────────────────────────────────────
-- The share_token is an invitation, not authorization (ARCHITECTURE.md §4).
-- Returns only a safe, minimal projection — never participant_a_id /
-- participant_b_id, never questions or answers. Restricted to non-DRAFT
-- rows: a DRAFT wavelength has no link yet, so it should never be
-- previewable even if a token somehow leaked early.
create or replace function get_wavelength_preview(p_token text)
returns table (
  state wavelength_state,
  participant_a_alias text,
  categories wavelength_category[],
  question_count smallint,
  is_taken boolean
)
language sql
security definer
stable
set search_path = public
as $$
  select w.state, w.participant_a_alias, w.categories, w.question_count,
         (w.participant_b_id is not null) as is_taken
    from wavelengths w
   where w.share_token = p_token
     and w.state <> 'DRAFT';
$$;

revoke all on function get_wavelength_preview(text) from public;
grant execute on function get_wavelength_preview(text) to anon, authenticated;

-- ── RPC: finalize_draft (DRAFT -> WAITING) ──────────────────────────────
-- Only A, only their own row. The heavy business validation (all questions
-- answered, question_count matches) lives in the trigger above so it is not
-- duplicated between this RPC and any other path that might change state.
create or replace function finalize_draft(p_id uuid, p_alias text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_alias text := btrim(p_alias);
begin
  if v_uid is null then
    raise exception 'authentication required';
  end if;
  if not is_valid_alias(v_alias) then
    raise exception 'alias must be 1-60 characters with no control characters';
  end if;

  update wavelengths
     set participant_a_alias = v_alias,
         state = 'WAITING'
   where id = p_id
     and participant_a_id = v_uid
     and state = 'DRAFT';

  if not found then
    raise exception 'wavelength not found, not owned by caller, or not in DRAFT state';
  end if;
end;
$$;

revoke all on function finalize_draft(uuid, text) from public;
grant execute on function finalize_draft(uuid, text) to authenticated;

-- ── RPC: claim_participant_b (WAITING -> IN_PROGRESS) ───────────────────
-- The one deliberate privilege escalation (SECURITY DEFINER): the caller is
-- not yet a participant, so RLS alone can't let them find this row. The
-- conditional UPDATE is the atomic "first claimant wins" primitive — a
-- second caller updates 0 rows and gets a clear rejection, never a takeover.
create or replace function claim_participant_b(p_token text, p_alias text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_alias text := btrim(p_alias);
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'authentication required';
  end if;
  if not is_valid_alias(v_alias) then
    raise exception 'alias must be 1-60 characters with no control characters';
  end if;

  update wavelengths
     set participant_b_id = v_uid,
         participant_b_alias = v_alias,
         state = 'IN_PROGRESS'
   where share_token = p_token
     and state = 'WAITING'
     and participant_b_id is null
     and participant_a_id <> v_uid -- A cannot also become B on their own wavelength
  returning id into v_id;

  if v_id is null then
    raise exception 'this wavelength is not available to join (already claimed, not found, or not ready)';
  end if;

  return v_id;
end;
$$;

revoke all on function claim_participant_b(text, text) from public;
grant execute on function claim_participant_b(text, text) to anon, authenticated;

-- ── RPC: submit_final_b (IN_PROGRESS -> COMPLETED) ──────────────────────
create or replace function submit_final_b(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'authentication required';
  end if;

  update wavelengths
     set state = 'COMPLETED'
   where id = p_id
     and participant_b_id = v_uid
     and state = 'IN_PROGRESS';

  if not found then
    raise exception 'wavelength not found, not owned by caller, or not in IN_PROGRESS state';
  end if;
end;
$$;

revoke all on function submit_final_b(uuid) from public;
grant execute on function submit_final_b(uuid) to authenticated;
