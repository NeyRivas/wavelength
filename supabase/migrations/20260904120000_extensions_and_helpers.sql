-- Wavelength — extensions and shared helper functions.
--
-- Helpers here are dependency-free and used both as table CHECK constraints
-- (schema migration) and inside the RPC functions (functions migration), so
-- they must exist before both.

create extension if not exists pgcrypto; -- gen_random_uuid(), gen_random_bytes()

-- Alias validation (participant_a_alias / participant_b_alias, and the
-- p_alias arguments to finalize_draft / claim_participant_b).
--
-- Security clarification (approved): length/content are validated, but the
-- character set is NOT restricted to ASCII — aliases may contain any normal
-- Unicode text (accents, non-Latin scripts, emoji, etc.). The only content
-- rule is rejecting ASCII control characters (which have no legitimate use
-- in a display name and could otherwise corrupt rendering/logs). Output
-- escaping on display is a frontend concern (React escapes by default) and
-- is out of scope for this table-level helper.
create or replace function is_valid_alias(p_alias text)
returns boolean
language sql
immutable
as $$
  select p_alias is not null
     and char_length(btrim(p_alias)) between 1 and 60
     and p_alias !~ '[\x00-\x1F\x7F]';
$$;

comment on function is_valid_alias(text) is
  'Alias rule: 1-60 characters after trimming, no ASCII control characters. Full Unicode otherwise allowed (no ASCII-only restriction).';

-- High-entropy, URL-safe share token (32 hex chars = 128 bits of entropy).
-- Looked up only by exact equality (see rls policies / get_wavelength_preview);
-- never listed, so this is not enumerable.
create or replace function generate_share_token()
returns text
language sql
volatile
as $$
  select encode(gen_random_bytes(16), 'hex');
$$;
