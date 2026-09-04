-- Wavelength — core schema (ARCHITECTURE.md §3).
--
-- Source of truth is Questions + Answers + Scoring Rules. No results/scores
-- table: results are computed on read once state = COMPLETED (see §8).

create type wavelength_state as enum ('DRAFT', 'WAITING', 'IN_PROGRESS', 'COMPLETED');

create type wavelength_category as enum (
  'relationship',
  'lifestyle',
  'money',
  'adventures_travel',
  'future',
  'values_priorities'
);

create type question_type as enum ('choice', 'scale', 'situation');

create type participant_role as enum ('A', 'B');

-- ─────────────────────────────────────────────────────────────────────────
create table wavelengths (
  id                   uuid primary key default gen_random_uuid(),
  share_token          text not null unique default generate_share_token(),
  state                wavelength_state not null default 'DRAFT',

  participant_a_id     uuid not null references auth.users (id),
  participant_b_id     uuid references auth.users (id),
  participant_a_alias  text,
  participant_b_alias  text,

  -- Configuration chosen by A before any question exists — not derivable
  -- from `questions`, so it is not redundant data (ARCHITECTURE.md §3).
  question_count       smallint not null check (question_count between 5 and 12),
  categories           wavelength_category[] not null,

  created_at           timestamptz not null default now(),
  waiting_at           timestamptz,
  in_progress_at       timestamptz,
  completed_at         timestamptz,

  constraint wavelengths_categories_bounds check (
    array_length(categories, 1) between 1 and 6
  ),
  -- Resolved decision (ARCHITECTURE.md §13.A): categories are capped by the
  -- question count, so every selected category is guaranteed >=1 question.
  constraint wavelengths_categories_capped_by_question_count check (
    array_length(categories, 1) <= question_count
  ),
  constraint wavelengths_b_alias_requires_b check (
    participant_b_id is not null or participant_b_alias is null
  ),
  constraint wavelengths_participants_distinct check (
    participant_a_id is distinct from participant_b_id
  ),
  constraint wavelengths_a_alias_valid check (
    participant_a_alias is null or is_valid_alias(participant_a_alias)
  ),
  constraint wavelengths_b_alias_valid check (
    participant_b_alias is null or is_valid_alias(participant_b_alias)
  )
);

create index wavelengths_participant_a_idx on wavelengths (participant_a_id);
create index wavelengths_participant_b_idx on wavelengths (participant_b_id);

-- ─────────────────────────────────────────────────────────────────────────
create table questions (
  id             uuid primary key default gen_random_uuid(),
  wavelength_id  uuid not null references wavelengths (id) on delete cascade,
  category       wavelength_category not null,
  type           question_type not null,
  text           text not null check (char_length(btrim(text)) between 3 and 300),
  -- 2-5 option strings for 'choice'/'situation'; null for 'scale' (fixed,
  -- shared 1-5 label set — see lib/wavelength/categories.ts SCALE_LABELS).
  -- Basic shape only here (no subqueries in a CHECK constraint); per-option
  -- content validation is a trigger — see functions_and_triggers.sql.
  options        jsonb,
  order_index    smallint not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint questions_order_unique unique (wavelength_id, order_index),

  constraint questions_options_shape check (
    (type = 'scale' and options is null)
    or (
      type in ('choice', 'situation')
      and options is not null
      and jsonb_typeof(options) = 'array'
      and jsonb_array_length(options) between 2 and 5
    )
  )
);

create index questions_wavelength_order_idx on questions (wavelength_id, order_index);

-- Duplicate-question prevention (ARCHITECTURE.md §13 default: scoped
-- per-questionnaire, not globally). Expression index, so it must be a
-- separate CREATE UNIQUE INDEX rather than an inline UNIQUE(...) clause.
create unique index questions_wavelength_text_uidx
  on questions (wavelength_id, lower(btrim(text)));

-- ─────────────────────────────────────────────────────────────────────────
create table answers (
  id             uuid primary key default gen_random_uuid(),
  -- Denormalized FK: lets RLS policies join straight to the parent
  -- wavelength without an extra hop through questions on every check.
  wavelength_id  uuid not null references wavelengths (id) on delete cascade,
  question_id    uuid not null references questions (id) on delete cascade,
  participant    participant_role not null,
  -- Integer 0-4 (option index) for choice/situation, 1-5 for scale.
  -- Shape/range validated against the question by a trigger (can't be a
  -- plain CHECK — it must join to `questions`).
  value          jsonb not null,
  answered_at    timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint answers_one_per_participant unique (question_id, participant)
);

create index answers_wavelength_participant_idx on answers (wavelength_id, participant);
