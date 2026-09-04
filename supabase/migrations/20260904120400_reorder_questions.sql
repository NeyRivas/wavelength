-- Wavelength — question reordering support (Phase 4).
--
-- Reordering N questions atomically requires the (wavelength_id,
-- order_index) uniqueness check to be deferred to transaction-commit
-- rather than checked after each individual row update within the same
-- statement — otherwise a valid permutation can transiently collide with
-- another row's not-yet-updated order_index mid-statement. Postgres only
-- allows changing a constraint's deferrability via ALTER TABLE ... ALTER
-- CONSTRAINT for foreign keys, so a UNIQUE constraint has to be dropped and
-- re-added with DEFERRABLE INITIALLY DEFERRED — same guarantee (wavelength_id,
-- order_index) stays unique, just checked at commit instead of per-row. This
-- is a no-op for every other insert/update path: a single-row change still
-- commits (and is therefore checked) immediately in an autocommit
-- transaction, so it only changes behavior for the multi-row case below.
alter table questions drop constraint questions_order_unique;
alter table questions
  add constraint questions_order_unique unique (wavelength_id, order_index)
  deferrable initially deferred;

-- Not a state-transition RPC like the three in functions_and_triggers.sql —
-- this is SECURITY INVOKER (the default) purely to make an otherwise
-- ordinary set of `questions` UPDATEs atomic. RLS still applies to every
-- row exactly as if the caller had run the UPDATEs directly themselves
-- (questions_update policy: A only, DRAFT only) — no privilege escalation.
create or replace function reorder_questions(p_wavelength_id uuid, p_question_ids uuid[])
returns void
language plpgsql
as $$
declare
  v_expected_count int;
  v_updated_count int;
begin
  -- The given ids must be exactly the current question set for this
  -- wavelength (same members, no duplicates, none missing/extra) — a
  -- sorted-array comparison catches all three at once.
  if (
    select array_agg(id order by id) from unnest(p_question_ids) as t(id)
  ) is distinct from (
    select array_agg(id order by id) from questions where wavelength_id = p_wavelength_id
  ) then
    raise exception
      'reorder must include exactly the current set of questions for this wavelength, each exactly once, with no duplicates';
  end if;

  select array_length(p_question_ids, 1) into v_expected_count;

  update questions
     set order_index = new_order.position - 1
    from (
      select id, row_number() over () as position
        from unnest(p_question_ids) as t(id)
    ) as new_order
   where questions.id = new_order.id
     and questions.wavelength_id = p_wavelength_id;

  get diagnostics v_updated_count = row_count;

  -- The membership check above guarantees the ids exist and belong to this
  -- wavelength; if RLS still filtered some of them out (wrong owner, or the
  -- wavelength is no longer DRAFT), the UPDATE silently affects fewer rows
  -- rather than erroring — surface that as a clear failure instead of a
  -- silent partial reorder.
  if v_updated_count <> v_expected_count then
    raise exception
      'reorder failed — the questionnaire may no longer be in DRAFT, or the caller does not own it';
  end if;
end;
$$;

revoke all on function reorder_questions(uuid, uuid[]) from public;
grant execute on function reorder_questions(uuid, uuid[]) to authenticated;
