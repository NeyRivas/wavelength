# Wavelength — Technical Architecture

Status: **APPROVED** — the two product ambiguities raised in the previous revision are resolved (see §13). No application code has been written yet; this document is the analysis/plan deliverable only.

Stack (approved): Next.js (App Router) + TypeScript + Supabase (Postgres + Auth + RLS). No other backend.

---

## 1. Architecture

Wavelength is a two-party, linkable, stateful questionnaire app with **no user accounts**. The architecture has exactly two runtime components:

- **Next.js app** (Vercel or similar) — renders UI (Server Components + a few Client Components for interactive editing), and exposes **Server Actions** as the only server-side entry point. Server Actions are thin: validate shape with `zod`, then call Supabase using **the requesting participant's own session** (never the service-role key).
- **Supabase Postgres** — sole source of truth and sole authorization boundary. RLS policies + a small number of `SECURITY DEFINER`/`SECURITY INVOKER` RPC functions + a state-transition trigger enforce every privacy and locking rule from the spec, independent of what the Next.js layer does or what a manipulated client sends.

Key principle driving every decision below: **the browser is never trusted to say "I am A" or "I am B."** Identity is a Supabase Anonymous Auth session (a real, signed JWT with a stable `auth.uid()`), and every privacy rule is expressed as a Postgres RLS policy keyed off `auth.uid()`, not off any client-supplied field.

No custom REST/GraphQL API layer is needed — Server Actions calling Supabase (PostgREST/RPC under the hood) are sufficient and keep the MVP simple, per the "avoid unnecessary dependencies" principle.

---

## 2. Project structure

```
wavelength/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                     # Landing / "Create a Wavelength"
│   ├── create/
│   │   └── page.tsx                 # Participant A: DRAFT builder + finalization (categories, questions, answers, alias)
│   ├── w/[token]/
│   │   ├── page.tsx                 # Entry router: A's share view, B's join screen, "already taken", or not-found
│   │   ├── answer/page.tsx          # Participant B: answering flow (IN_PROGRESS)
│   │   └── result/page.tsx          # Shared result (both participants, COMPLETED only)
│   └── actions/                     # Server Actions — the only server-side entry point
│       ├── shared.ts                # ActionState convention shared by every mutating action
│       ├── draft.ts                 # createDraft, finalizeDraft (→ finalize_draft RPC)
│       ├── questions.ts             # add/update/delete/moveQuestion/changeType
│       ├── answers.ts               # saveAnswerA, saveAnswerB (one shared internal helper)
│       └── join.ts                  # claimParticipantB, submitFinalB (→ claim_participant_b / submit_final_b RPCs)
├── proxy.ts                          # Next.js "proxy" (middleware) entry point — see lib/supabase/proxy.ts
├── lib/
│   ├── supabase/
│   │   ├── server.ts                # SSR client bound to the request's cookies (RLS-respecting)
│   │   ├── client.ts                # Browser client + client-side anonymous-session backstop
│   │   ├── proxy.ts                 # Per-request session bootstrap/refresh (auth.getUser(), signInAnonymously())
│   │   ├── identity.ts              # getUserId() / requireUserId() — the auth.uid() every later phase calls
│   │   └── database.types.ts        # generated via `supabase gen types typescript`
│   ├── scoring/
│   │   └── score.ts                 # pure, deterministic scoring functions (+ tests)
│   ├── validation/
│   │   └── schemas.ts               # zod schemas mirroring DB constraints (UX-layer only)
│   └── wavelength/
│       ├── categories.ts            # the 6 fixed categories, 3 question types, scale labels
│       ├── state.ts                 # TS mirror of the state enum + UI-only guards
│       ├── absolute-url.ts          # builds the share link from request headers (Phase 5)
│       └── result.ts                # scoring -> presentation mapping/sorting for the result screens (Phase 6)
├── components/
│   ├── questionnaire/                # question editor, reorder list, type switcher, finalize form
│   ├── wavelength/                   # share view + copy button (A), join form (B), submit-final form
│   ├── result/                       # global summary, wave indicator, category grid, aligned/different/all-questions sections, reveal transition
│   └── ui/
├── supabase/
│   └── migrations/                   # Phase 1 schema/RLS/RPCs; extended in Phase 4 (reorder_questions, category immutability)
├── tests/
│   ├── unit/                         # scoring + validation (Vitest)
│   ├── integration/                  # two-anonymous-session RLS behavior tests
│   └── e2e/                          # Playwright, two browser contexts (A + B)
├── ARCHITECTURE.md
├── .env.example
└── package.json
```

---

## 3. Database schema (Supabase/PostgreSQL)

Design choices:

- Source of truth is **Questions + Answers + Scoring Rules**, exactly as specified. No `results`/`scores` table — results are computed on read by a pure TypeScript function once `state = COMPLETED` (deterministic, cheap, trivially testable; nothing to keep in sync or invalidate).
- **MVP update (supersedes the original design below):** `wavelengths` no longer carries an upfront `question_count` or `categories` column at all. Question creation is progressive — A never declares a target count or a category set before building; each question picks its own category as it's created, and the "how many so far" number is always just `count(*) from questions`. The only DB-enforced bounds are a hard cap of 12 questions at any time (`questions_enforce_max_count` trigger) and a 5-12 range check at finalize time (`enforce_wavelength_transition`) — see `supabase/migrations/20260906120000_mvp_choice_scale_progressive.sql`.
- Category, question type, participant role, and state are fixed, closed sets → Postgres `enum` types. **MVP update:** question type is now 2 values (`choice`, `scale`) — `situation` was removed; it scored identically to `choice` and added no distinct behavior.

```sql
create extension if not exists pgcrypto; -- gen_random_uuid()

create type wavelength_state as enum ('DRAFT','WAITING','IN_PROGRESS','COMPLETED');

create type wavelength_category as enum (
  'relationship', 'lifestyle', 'money', 'adventures_travel', 'future', 'values_priorities'
);

create type question_type as enum ('choice', 'scale'); -- MVP: 'situation' removed

create type participant_role as enum ('A', 'B');

-- ─────────────────────────────────────────────────────────────────
create table wavelengths (
  id                 uuid primary key default gen_random_uuid(),
  share_token        text not null unique,              -- unguessable, url-safe (~125 bits entropy)
  state              wavelength_state not null default 'DRAFT',

  participant_a_id   uuid not null references auth.users(id),
  participant_b_id   uuid references auth.users(id),
  participant_a_alias text,
  participant_b_alias text,

  -- MVP: no question_count / categories columns — see the "MVP update" note
  -- above. Question count and categories used are always derived live from
  -- `questions`, never pre-declared here.

  created_at         timestamptz not null default now(),
  waiting_at         timestamptz,
  in_progress_at     timestamptz,
  completed_at       timestamptz,

  constraint b_alias_requires_b check (participant_b_id is not null or participant_b_alias is null)
);

create index wavelengths_participant_a_idx on wavelengths (participant_a_id);
create index wavelengths_participant_b_idx on wavelengths (participant_b_id);

-- ─────────────────────────────────────────────────────────────────
create table questions (
  id            uuid primary key default gen_random_uuid(),
  wavelength_id uuid not null references wavelengths(id) on delete cascade,
  category      wavelength_category not null,
  type          question_type not null,
  text          text not null check (char_length(btrim(text)) between 3 and 300),
  options       jsonb,          -- required (2–5 strings) for 'choice'; null for 'scale'
  order_index   smallint not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  unique (wavelength_id, order_index),
  unique (wavelength_id, lower(btrim(text))),   -- prevents identical questions (DB-enforced)

  constraint options_shape check (
    (type = 'scale' and options is null) or
    (type = 'choice'
       and jsonb_typeof(options) = 'array'
       and jsonb_array_length(options) between 2 and 5)
  )
);

create index questions_wavelength_order_idx on questions (wavelength_id, order_index);

-- ─────────────────────────────────────────────────────────────────
create table answers (
  id            uuid primary key default gen_random_uuid(),
  wavelength_id uuid not null references wavelengths(id) on delete cascade,  -- denormalized FK, needed by RLS policies
  question_id   uuid not null references questions(id) on delete cascade,
  participant   participant_role not null,
  value         jsonb not null,   -- integer 0–4 (option index) for choice; one of 0/25/50/75/100 for scale
  answered_at   timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  unique (question_id, participant)
);

create index answers_wavelength_participant_idx on answers (wavelength_id, participant);
```

A `BEFORE INSERT/UPDATE` trigger on `answers` validates that `value` is shape/range-correct for the referenced question's `type`/`options` (can't be expressed as a plain `check` because it must join to `questions`).

**Category balance is intentionally not a DB constraint, and has no UI presence at all (QA update, supersedes §13.B below).** Nothing in the schema or RLS blocks an uneven distribution, `finalizeDraft` never rejects a draft for being unbalanced, and — as of this QA fix — the question editor no longer shows any per-category tally or indicator either. A gets no signal about distribution while building; categories still live entirely on each question and are used wherever results need them.

---

## 4. Participant identification & authorization strategy

**Supabase Anonymous Auth**, not a client-generated ID in `localStorage`.

Why: the spec requires "an anonymous browser participant credential" whose authorization is "enforced by the backend/database" and explicitly forbids "frontend-only hiding." A plain client-generated UUID stored in a cookie is just a claim — Postgres has no way to verify it, so it _cannot_ back a real RLS policy (anyone could forge it via devtools or a raw API call). A Supabase anonymous session (`supabase.auth.signInAnonymously()`) is a cryptographically signed JWT issued by Supabase's auth server; its `sub` claim becomes `auth.uid()` inside every RLS policy and can't be forged by the client. It carries no email/password/identity — it satisfies "no accounts, no passwords, no email" while still being a real, DB-verifiable credential.

Flow:

1. On first visit to any page, the browser silently calls `signInAnonymously()` if it has no session. The session (access + refresh token) persists via `@supabase/ssr` cookies, so both Server Components and the browser client see the same identity, and it survives reloads/tab-close — but is lost if the user clears site data or switches browsers/devices, exactly as the spec accepts ("no automatic recovery in MVP"). Concretely (Phase 2): `proxy.ts` (Next.js's middleware entry point) calls `auth.getUser()` on every matched request — which revalidates the token against Supabase Auth and transparently refreshes it if needed — and calls `signInAnonymously()` itself if no valid session comes back, so an identity exists before any Server Component or Server Action runs. `lib/supabase/client.ts`'s `ensureAnonymousSession()` is a client-side backstop for the rare case a Client Component runs without having gone through that first. Server code that needs the caller's id calls `lib/supabase/identity.ts`'s `requireUserId()` (throws a clear, typed error if somehow still missing) or `getUserId()` (returns `null`) — both call `auth.getUser()`, never the unverified `auth.getSession()`.
2. **Participant A** = whichever `auth.uid()` created the `wavelengths` row (`participant_a_id`, set at draft creation, immutable after).
3. **Participant B** = whichever `auth.uid()` first successfully **claims** the row via an atomic RPC (`participant_b_id` starts `null`; claim is a conditional `UPDATE ... WHERE participant_b_id IS NULL`, so only the first claimant wins — a second visitor with the same link gets a clear "this Wavelength already has two participants" response, never a takeover).
4. The `share_token` in the URL is the _invitation_, not the _authorization_. It lets anyone look up a minimal, non-sensitive preview (state, A's alias, category list, whether B is already taken) so the join screen can render — but it grants no read access to questions or answers. Actual read/write access to questions/answers is decided exclusively by whether the caller's `auth.uid()` matches `participant_a_id`/`participant_b_id` on the parent `wavelengths` row, checked by RLS on every query.

This is also why "third parties who merely obtain the link cannot read private responses" holds: knowing the token lets you see the (harmless) preview and, if the B slot is still open, _become_ B — which is the product's own design (anyone with the link can join as B, same as any shared-link product) — but it never grants read access to A's or B's actual answers.

---

## 5. Row Level Security strategy

RLS is enabled on all three tables. Reads are governed by RLS `SELECT` policies; every **write** with product-rule side effects (claiming B, locking A's draft, completing B's submission) goes through a small, purpose-built RPC function rather than a broad table `UPDATE` policy — this keeps "who can change what, and when" auditable in one place per action instead of spread across generic policies.

**`wavelengths`**

- `SELECT`: `auth.uid() = participant_a_id OR auth.uid() = participant_b_id` (participants only — no open/enumerable `SELECT`, so the table can't be scanned to discover other people's wavelengths).
- Pre-claim preview (state, categories, A's alias, "is B taken") is served by `get_wavelength_preview(token)`, a narrow `SECURITY DEFINER` function doing an exact `share_token` lookup and returning only that safe projection — never the full row, never `participant_a_id`/`participant_b_id`, never answers.
- No general client `UPDATE`; all transitions go through the three RPCs below.

**`questions`**

- `SELECT`: participant (A or B) of the parent wavelength, any state — B needs to read question text/options to answer.
- `INSERT/UPDATE/DELETE`: only `auth.uid() = participant_a_id` **and** parent `state = 'DRAFT'`. Once WAITING, every questions-table write is rejected by RLS regardless of what the client sends.
- A question's `category` is additionally immutable after creation (approved product rule) — a `BEFORE UPDATE` trigger (`enforce_question_category_immutable`, added in Phase 4) rejects any attempt to change it, independent of RLS, so this holds even against a direct API call.
- Reordering (Phase 4) goes through `reorder_questions(wavelength_id, question_ids)`, `SECURITY INVOKER` — not a state-transition RPC like the three below, just a way to make a multi-row `order_index` swap atomic (the `questions_order_unique` constraint is `DEFERRABLE INITIALLY DEFERRED` for exactly this). RLS applies to its internal `UPDATE`s exactly as if the caller had issued them directly — no privilege escalation.

**`answers`**

- `SELECT`: a participant can always read **their own** answers. They can read the **other** participant's answers only once the parent `state = 'COMPLETED'`. This is the core privacy rule from the spec (B can't see A's answers before finishing; A can't see B's progress or answers), enforced at the query level — a manipulated client simply gets zero rows back, there is nothing to hide client-side.
- `INSERT/UPDATE` (upsert, supports B "going back and changing answers"): A only when `participant='A' AND auth.uid()=participant_a_id AND wavelength.state='DRAFT'`; B only when `participant='B' AND auth.uid()=participant_b_id AND wavelength.state='IN_PROGRESS'`. Once `COMPLETED`, both are rejected — "responses are locked" after completion.
- `DELETE`: no policy → denied to all clients.

**RPC functions** (the only way state transitions happen):

| Function                            | Security mode                                                                                                 | Caller                                   | Effect                                                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `finalize_draft(id, alias)`         | `INVOKER` (A already owns the row per RLS)                                                                    | A                                        | Validates alias present, all questions answered by A, question count matches config → `DRAFT → WAITING` |
| `claim_participant_b(token, alias)` | `DEFINER` (caller isn't a participant yet — this is the one deliberate, narrowly-scoped privilege escalation) | anyone with the link, first to call wins | Atomically binds `participant_b_id = auth.uid()`, sets alias → `WAITING → IN_PROGRESS`                  |
| `submit_final_b(id)`                | `INVOKER` (B already owns the row per RLS)                                                                    | B                                        | Validates all questions answered by B → `IN_PROGRESS → COMPLETED`                                       |

All three re-check their preconditions server-side even though the UI already enforces them — the DB never trusts the client to have checked first.

---

## 6. State machine implementation

States: `DRAFT → WAITING → IN_PROGRESS → COMPLETED`, with `IN_PROGRESS → IN_PROGRESS` as the "B saved partial progress" no-op.

Enforced twice, deliberately redundantly:

1. **The three RPCs above** are the only intended entry point, and each encodes the _business_ precondition for its transition (all questions answered, alias present, slot still free).
2. **A `BEFORE UPDATE` trigger on `wavelengths`** independently re-validates that `old.state → new.state` is one of the four allowed edges (or a same-state no-op) and re-checks the same "all questions answered" business rule, so that even a direct PostgREST `PATCH` bypassing the RPCs (e.g., a manipulated client hitting the table endpoint directly) cannot force an illegal or premature transition. This is the concrete implementation of "RLS/DB must protect data even if the client is manipulated" applied to the state machine specifically, not just to reads.

```sql
create or replace function enforce_wavelength_transition() returns trigger
language plpgsql as $$
begin
  if new.state = old.state then
    return new; -- no-op (e.g. progress save)
  end if;

  if not (
    (old.state = 'DRAFT'       and new.state = 'WAITING') or
    (old.state = 'WAITING'     and new.state = 'IN_PROGRESS') or
    (old.state = 'IN_PROGRESS' and new.state = 'COMPLETED')
  ) then
    raise exception 'invalid wavelength state transition: % -> %', old.state, new.state;
  end if;

  return new;
end;
$$;

create trigger wavelengths_state_transition
  before update on wavelengths
  for each row execute function enforce_wavelength_transition();
```

The frontend mirrors the enum as a TS union (`lib/wavelength/state.ts`) purely for **UI gating** (which screen to render, which buttons are active) — it is explicitly documented in that file as non-authoritative; the DB is what actually enforces the rule.

---

## 7. API / Server Actions strategy

No separate REST/GraphQL layer. Next.js **Server Actions** are the only server-side surface, each following the same shape:

1. Parse/validate input with `zod` (reject malformed shape before touching the DB — UX quality, not security).
2. Build a Supabase client from the _request's own cookies_ (`@supabase/ssr`) — so every query runs **as the calling participant**, under RLS. The service-role key is never used in this request path (see §9).
3. Call a table query or one of the three RPCs.
4. Return a typed result / `redirect()` / `revalidatePath()` as appropriate.

Concrete actions (✅ = implemented as of the phase noted): `createDraft` ✅ Phase 4, `addQuestion` ✅ Phase 4, `updateQuestion` ✅ Phase 4, `deleteQuestion` ✅ Phase 4, `moveQuestion` ✅ Phase 4 (calls the `reorder_questions` RPC — §5), `changeQuestionType` ✅ Phase 4, `saveAnswerA` ✅ Phase 4, `finalizeDraft` ✅ Phase 5 (`app/actions/draft.ts` → `finalize_draft` RPC, then `redirect()`s to the share link), `getWavelengthPreview` ✅ Phase 5 (called directly from `app/w/[token]/page.tsx` — a read, so no Server Action wrapper; every other entry here is a mutation), `claimParticipantB` ✅ Phase 5 (`app/actions/join.ts` → `claim_participant_b` RPC), `saveAnswerB` ✅ Phase 5 (`app/actions/answers.ts`, shares its implementation with `saveAnswerA` via one internal helper — `participant` is hardcoded per exported wrapper, never client-supplied), `submitFinalB` ✅ Phase 6 (`app/actions/join.ts` → `submit_final_b` RPC, then `redirect()`s to the result page), `getResult` ✅ Phase 6 (not a Server Action — a read, done directly in `app/w/[token]/result/page.tsx`: fetches questions+answers under RLS, then `lib/wavelength/result.ts` runs the scoring module and the presentation-layer sorting/grouping on top — only produces meaningful data once `COMPLETED`, since pre-completion RLS simply won't return the other participant's rows).

`updateDraftConfig` (changing question count/categories after questions already exist) was scoped out of Phase 4 — reconciling existing questions against a shrunk category set is real added complexity the approved spec doesn't ask for; A can still freely add/edit/delete/reorder questions and their own config was fixed correctly at creation time (categories already capped by the chosen count).

---

## 8. Scoring implementation approach

Pure, deterministic, **no AI**, implemented in `lib/scoring/score.ts` (Phase 3) — no DB/network/React dependency, so every rule is directly unit-testable:

**MVP update:** `situation` was removed as a question type (scored identically to `choice`, no distinct behavior). `scale` answers were re-based from a 1-5 index onto the fixed 0/25/50/75/100 value domain, so the scoring formula is now a direct `100 - |A - B|` — no lookup table needed, and it reproduces the approved table exactly.

```ts
scoreQuestion(question, valueA, valueB): number // 0-100
  choice → valueA === valueB ? 100 : 0
  scale  → 100 - |valueA - valueB| // values are themselves 0/25/50/75/100

computeQuestionScores(questions, answers): QuestionScore[]
  // requires exactly one A + one B answer per question (throws otherwise:
  // MissingAnswerError / DuplicateAnswerError / UnknownQuestionError /
  // DuplicateQuestionError / InvalidAnswerValueError); output is in
  // original question order (orderIndex), preserved for later tie-breaking

computeGlobalScore(questionScores): number       // round-half-up average, equal weight
computeCategoryScores(questionScores): CategoryScore[] // round-half-up average per category, equal weight
alignmentLevel(score): AlignmentLevel            // >=75 High | >=50 Mixed | else Low, applied to the *rounded* integer

computeWavelengthResult(questions, answers): WavelengthResult // the above, composed
```

`computeCategoryScores`/`computeWavelengthResult` return categories and questions in original order, **not** sorted by score — sorting "highest alignment first", picking the top-3 "Where You're Aligned" questions, and grouping "Different Wavelengths" are Result-screen presentation logic (a later phase), not scoring; this module only guarantees the numbers (and each question's original `orderIndex`) that presentation logic will need.

Run server-side inside `getResult`, after fetching questions + both participants' answers (which RLS only allows once `COMPLETED`). Nothing is persisted — recomputed on every view, which is cheap (≤12 questions) and guarantees the result can never drift from the underlying answers.

**Phase 6 addition:** `lib/wavelength/result.ts` sits between this module and the result screen. It maps DB rows into `computeWavelengthResult`'s input shape, joins the returned scores back to human-readable question/answer text (`formatAnswer` — the option text for choice, the fixed 0/25/50/75/100 label for scale, never a raw index/number), and does the presentation-only sorting/selection the result screens need: categories highest-alignment-first, the top-3 "Where You're Aligned" (regardless of category), every differing question for "Different Wavelengths" (lowest-alignment-first), and per-category question grouping for "All Questions". None of that sorting/selection is a scoring rule — every score itself still comes from `lib/scoring/score.ts` unchanged — and `Array.sort`'s guaranteed stability is what keeps ties in original question order without extra bookkeeping. A category tie is broken by its first question's `orderIndex`, since the spec ties category order to question order rather than defining a separate one.

---

## 9. Security risks & mitigations

| Risk                                                                                             | Mitigation                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Client forges "I am A/B"                                                                         | Identity is a signed Supabase Anonymous Auth JWT; RLS keys off `auth.uid()`, never a client-supplied field                                                                                                                  |
| Service-role key used in the request path, bypassing RLS entirely                                | Service-role key is a server-only env var, not referenced anywhere in Server Actions; only ever used for offline admin/migration scripts if at all. Code-review checklist item.                                             |
| Two browsers race to claim the B slot                                                            | `claim_participant_b` does a conditional `UPDATE ... WHERE participant_b_id IS NULL`; loser gets an explicit "already joined" error, never a silent takeover                                                                |
| Direct PostgREST call bypasses the RPCs to force a state change or skip "all questions answered" | The state trigger (§6) re-validates transition legality _and_ the business precondition independently of the RPC layer                                                                                                      |
| B's answers (or A's) leak into a server-rendered payload before `COMPLETED`                      | Never fetched with elevated privilege and filtered client-side — the RLS-scoped query itself returns zero rows for the other participant pre-completion, so there is nothing to leak. Covered by an integration test (§10). |
| Share-token guessing / enumeration                                                               | Token is high-entropy (≥21 url-safe chars, ~125 bits) and looked up by exact equality only, never listed; `wavelengths` has no open `SELECT`                                                                                |
| Anonymous-auth abuse (bot mass sign-in)                                                          | Supabase supports attaching CAPTCHA (e.g. Turnstile) to the anonymous sign-in endpoint; recommended for production hardening but deferred for MVP simplicity unless abuse is observed                                       |
| XSS via alias/free-text option labels                                                            | React auto-escapes on render; server also validates length/charset on every text field, independent of client-side checks                                                                                                   |

---

## 10. Testing strategy

- **Unit (Vitest)** — the scoring module (table-driven: every diff 0–4, both alignment-boundary values 49/50 and 74/75, tie handling) and validation schemas (question count bounds, category count bounds, duplicate detection). Fully offline, no DB.
- **Integration (RLS-focused)** — spin up Supabase locally (`supabase start`), sign in two distinct anonymous sessions as "A" and "B," and assert the actual privacy rules against the real database: B cannot `SELECT` A's answers pre-completion (empty result, not an error), A cannot write B's answers, no client can force an illegal state transition, locked fields reject writes once `WAITING`/`COMPLETED`, the second claimant of a B slot is rejected. This is the layer that proves the product's privacy guarantees, not just the UI.
- **E2E (Playwright)** — two browser contexts driving the full `Create → Answer → Share → Compare → Shared Result` flow end-to-end, including "B leaves and resumes on the same browser."

---

## 11. Environment / configuration requirements

Must be in place before Phase 1 can start:

- A Supabase project (local via `supabase` CLI + Docker for dev; a separate project for production).
- **Anonymous Sign-ins enabled** in Supabase Auth settings — off by default, required for the identity model in §4.
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only; minimal/no runtime use per §9).
- `@supabase/ssr` for cookie-based session handling shared between Server Components and the browser.
- A decision on AI-suggestion provider + API key (e.g. `ANTHROPIC_API_KEY`) — only needed once Phase 7 (AI-assisted question/option suggestions) is built; this is a development-time authoring aid, not part of scoring, per the spec.
- Hosting target (Vercel is the natural fit for Next.js) and, optionally, a domain for share links.
- CI running lint/typecheck/unit tests on every push, plus the Supabase-CLI-backed integration suite.

---

## 12. Implementation phases

0. ✅ **Scaffolding** — Next.js + TS app skeleton, tooling (ESLint/Prettier/Vitest), CI-ready, env wiring.
1. ✅ **Schema + RLS + state trigger**, proven by the integration test suite _before any UI exists_ — this is the layer everything else depends on for correctness.
2. ✅ **Participant identity plumbing** — anonymous sign-in bootstrap (`proxy.ts`), SSR client helpers, `getUserId`/`requireUserId`.
3. ✅ **Scoring engine** — pure TS module + exhaustive unit tests (no DB dependency).
4. ✅ **Participant A flow (DRAFT)** — category/count selection, question CRUD/reorder/type-change, duplicate prevention, answering, and changing answers before finalization. Finalization itself (`finalizeDraft`, the alias step, "Create my Wavelength") is deliberately **not** built yet — that's Phase 5/6's entry point, once the share link and Participant B flow exist to receive it.
5. ✅ **Shareable link + Participant B flow** — `finalizeDraft` (DRAFT → WAITING, alias entry, "Create my Wavelength"), the `/w/[token]` entry router (participant-aware: A's share view, B's join screen, or "already taken"), `claimParticipantB`, B's answering flow with incremental saving and resume-on-same-browser.
6. ✅ **Completion + Result** — `submitFinalB` ("See our results", only enabled once every question is answered), a brief "Finding your wavelength…" transition (`components/result/result-reveal.tsx` — purely presentational, delays revealing an already-computed result; no recomputation, no AI), and the full result view at `/w/[token]/result` in the approved order: Global → Categories → Where You're Aligned → Different Wavelengths → Questions.
7. **AI-assisted suggestions** (optional layer, isolated so it can slip without blocking MVP) — question/option suggestions A can accept/edit/ignore.
8. **Polish & hardening** — accessibility, responsive design, full E2E suite, RLS/security audit pass.
9. **Deployment** — production Supabase project, production env config, smoke tests.

---

## 13. Resolved product decisions & minor engineering defaults

Everything in the spec was either concrete enough to implement directly, or resolved below. Two items genuinely changed user-facing behavior and were decided by you before this revision:

**A. Selected categories vs. question count — SUPERSEDED by the MVP's progressive-creation requirement.**
The original design (cap categories by an upfront question count, quoted below for history) required A to declare a question count before picking categories. The MVP explicitly forbids that: A must be able to start creating questions without deciding a count first. There is no longer an upfront category selection step at all — each question picks its own category as it's created (from the fixed 6, no cap needed), and "categories used" is simply whichever ones actually appear on `questions`, always exactly in sync by construction (no separate declaration to drift out of). `wavelengths.categories`/`.question_count` were dropped entirely — see the "MVP update" note in §3 and `supabase/migrations/20260906120000_mvp_choice_scale_progressive.sql`.

<details><summary>Original decision (superseded, kept for history)</summary>

The category picker only allows selecting up to `min(6, question_count)` categories, so it's structurally impossible to select more categories than there are questions to distribute. Concretely:

- If A hasn't chosen a question count yet, default the flow to ask question count first, then present the category picker capped at that count (e.g., 5 questions → at most 5 categories selectable; 8–12 questions → all 6 remain selectable).
- If A later _lowers_ the question count below the number of categories already selected, the UI must prompt to drop the excess categories before continuing (can't silently discard a category with questions already written for it — those questions would need to be reassigned or removed first).
- Enforced at the DB level as a hard `check` constraint (`array_length(categories,1) <= question_count`, §3) as the authoritative backstop, with the UI cap as the primary (better) UX so A never hits the DB error in normal use.
- Net effect: every selected category is now guaranteed at least one question, so "categories used" (shown in results) and "categories selected" (chosen by A) are always the same set — no dead/empty categories.

</details>

**B. Strength of "reasonably balanced across categories" — RESOLVED, then further simplified by QA.**
Originally: advisory-only via a live per-category tally in the question editor (`CategoryBalance`), never blocking. **QA update: that indicator was removed entirely** — A now gets no signal at all about category distribution while building, not even a soft one. What's unchanged from the original resolution:

- No validation error prevents adding an "unbalanced" set of questions, and `finalizeDraft` never rejects a draft on balance grounds — its only checks remain alias present, all questions answered by A, and the question count being in the 5-12 range (§5, §6).
- No DB constraint expresses this rule at all (see the note under §3) — it is pure UI/UX (or, now, its deliberate absence), consistent with "keep the MVP technically simple" and avoiding a feature the QA pass decided added no value.

Minor engineering defaults chosen along the way (none change visible product behavior from what's specified, so not raised as decisions needed):

- DRAFT is persisted to the DB as soon as A begins (not held only in client state), so a reload mid-creation doesn't lose progress.
- The WAITING → IN_PROGRESS transition fires at the moment B claims the link + submits their alias (the natural reading of "B has started"), not at B's first individual answer.
- Converting a question's type (`choice` ⇄ `scale`, the only two MVP types) clears options when switching to `scale`, and gives a fresh 2-option placeholder when switching to `choice` — the scale is a fixed, shared 0/25/50/75/100 label set with no options of its own.
- **MVP addition:** question count has no upfront target at all — A adds questions progressively (5-12, 8 recommended but not required), and each question chooses its own category; there is no pre-declared category set to cap against (supersedes §13.A above). A hard cap of 12 questions is enforced independently of RLS by a `BEFORE INSERT` trigger (`questions_enforce_max_count`), consistent with `enforce_question_category_immutable`'s "the database enforces the rule" precedent.
- Duplicate-question prevention is scoped per-questionnaire (per `wavelength_id`), not globally across all Wavelengths ever created.
- Percentage rounding uses standard round-half-up at display time, and the alignment level (High/Mixed/Low) is computed from the _rounded_ integer so the label always matches what's shown.

---

**READY FOR IMPLEMENTATION**
