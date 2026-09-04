-- Wavelength — Row Level Security (ARCHITECTURE.md §5).
--
-- Reads are governed by RLS SELECT policies. Every write to `wavelengths`
-- with product-rule side effects (create draft aside) goes through the
-- three SECURITY DEFINER RPCs in functions_and_triggers.sql instead of a
-- broad UPDATE policy — there is deliberately NO update/delete policy on
-- `wavelengths` below, which makes direct client mutation of that table
-- structurally impossible (RLS default-denies any action with no matching
-- policy), not merely policy-restricted.
--
-- Grants mirror what a real Supabase project provides by default (broad
-- table-level grants to `authenticated`, restricted per-row by RLS) so this
-- migration is self-contained and portable to a fresh Postgres too.

alter table wavelengths enable row level security;
alter table questions enable row level security;
alter table answers enable row level security;

grant usage on schema public to anon, authenticated;

-- ── wavelengths ─────────────────────────────────────────────────────────
grant select, insert on wavelengths to authenticated;

create policy wavelengths_select on wavelengths
  for select
  using (auth.uid() = participant_a_id or auth.uid() = participant_b_id);

-- A creates their own draft directly (not a state transition, so not one of
-- the three RPCs). B is never set at creation time.
create policy wavelengths_insert on wavelengths
  for insert
  with check (
    auth.uid() = participant_a_id
    and state = 'DRAFT'
    and participant_b_id is null
  );

-- No UPDATE / DELETE policy: all further mutation goes through
-- finalize_draft / claim_participant_b / submit_final_b.

-- ── questions ───────────────────────────────────────────────────────────
grant select, insert, update, delete on questions to authenticated;

create policy questions_select on questions
  for select
  using (
    exists (
      select 1 from wavelengths w
      where w.id = questions.wavelength_id
        and (w.participant_a_id = auth.uid() or w.participant_b_id = auth.uid())
    )
  );

create policy questions_insert on questions
  for insert
  with check (
    exists (
      select 1 from wavelengths w
      where w.id = wavelength_id
        and w.participant_a_id = auth.uid()
        and w.state = 'DRAFT'
    )
  );

create policy questions_update on questions
  for update
  using (
    exists (
      select 1 from wavelengths w
      where w.id = questions.wavelength_id
        and w.participant_a_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from wavelengths w
      where w.id = wavelength_id
        and w.participant_a_id = auth.uid()
        and w.state = 'DRAFT'
    )
  );

create policy questions_delete on questions
  for delete
  using (
    exists (
      select 1 from wavelengths w
      where w.id = questions.wavelength_id
        and w.participant_a_id = auth.uid()
        and w.state = 'DRAFT'
    )
  );

-- ── answers ─────────────────────────────────────────────────────────────
grant select, insert, update on answers to authenticated;

-- Each participant always reads their own answers; the other participant's
-- answers only become readable once the wavelength is COMPLETED (core
-- privacy rule — ARCHITECTURE.md §4/§5).
create policy answers_select on answers
  for select
  using (
    (
      participant = 'A'
      and exists (
        select 1 from wavelengths w
        where w.id = answers.wavelength_id and w.participant_a_id = auth.uid()
      )
    )
    or (
      participant = 'B'
      and exists (
        select 1 from wavelengths w
        where w.id = answers.wavelength_id and w.participant_b_id = auth.uid()
      )
    )
    or exists (
      select 1 from wavelengths w
      where w.id = answers.wavelength_id
        and w.state = 'COMPLETED'
        and (w.participant_a_id = auth.uid() or w.participant_b_id = auth.uid())
    )
  );

create policy answers_insert on answers
  for insert
  with check (
    (
      participant = 'A'
      and exists (
        select 1 from wavelengths w
        where w.id = wavelength_id and w.participant_a_id = auth.uid() and w.state = 'DRAFT'
      )
    )
    or (
      participant = 'B'
      and exists (
        select 1 from wavelengths w
        where w.id = wavelength_id
          and w.participant_b_id = auth.uid()
          and w.state = 'IN_PROGRESS'
      )
    )
  );

-- Supports B "going back and changing answers" (and A editing before
-- finalizing) via upsert; locked once the relevant state has passed.
create policy answers_update on answers
  for update
  using (
    (
      participant = 'A'
      and exists (
        select 1 from wavelengths w
        where w.id = answers.wavelength_id and w.participant_a_id = auth.uid()
      )
    )
    or (
      participant = 'B'
      and exists (
        select 1 from wavelengths w
        where w.id = answers.wavelength_id and w.participant_b_id = auth.uid()
      )
    )
  )
  with check (
    (
      participant = 'A'
      and exists (
        select 1 from wavelengths w
        where w.id = wavelength_id and w.participant_a_id = auth.uid() and w.state = 'DRAFT'
      )
    )
    or (
      participant = 'B'
      and exists (
        select 1 from wavelengths w
        where w.id = wavelength_id
          and w.participant_b_id = auth.uid()
          and w.state = 'IN_PROGRESS'
      )
    )
  );

-- No DELETE policy on answers: answers are never individually deleted.
