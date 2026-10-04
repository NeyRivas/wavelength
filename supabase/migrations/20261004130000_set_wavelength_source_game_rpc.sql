-- Wavelength — fix ready-made drafts never actually recording their
-- source_game_id, which broke /create's ability to find "my draft for
-- this specific ready-made game" (both "Are we on the same page?" and
-- "Getting to know each other" started showing an empty builder instead
-- of their 12 seeded questions).
--
-- Root cause: 20260904120200_rls_policies.sql deliberately grants `select,
-- insert` on `wavelengths` only — "there is deliberately NO update/delete
-- policy on wavelengths... which makes direct client mutation of that
-- table structurally impossible". app/actions/ready-made-games.ts's
-- best-effort `.update({ source_game_id })` call (added to keep the
-- critical draft/question insert from failing if the column wasn't live
-- yet) was therefore guaranteed to fail on every call, silently — so
-- source_game_id never actually persisted, and /create's
-- `.eq("source_game_id", gameId)` lookup could never find a match.
--
-- Fix: a single, narrowly-scoped SECURITY DEFINER RPC, following the exact
-- same pattern as finalize_draft/claim_participant_b/submit_final_b below
-- it — not a general UPDATE grant/policy on wavelengths, which would
-- reopen the "structurally impossible" guarantee those three RPCs exist
-- to preserve. This one only ever sets source_game_id, only on the
-- caller's own row, only while it's still DRAFT, and only once (it never
-- overwrites an already-set value).
create or replace function set_wavelength_source_game(p_id uuid, p_source_game_id text)
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
     set source_game_id = p_source_game_id
   where id = p_id
     and participant_a_id = v_uid
     and state = 'DRAFT'
     and source_game_id is null;

  if not found then
    raise exception 'wavelength not found, not owned by caller, not in DRAFT state, or already has a source game';
  end if;
end;
$$;

revoke all on function set_wavelength_source_game(uuid, text) from public;
grant execute on function set_wavelength_source_game(uuid, text) to authenticated;
