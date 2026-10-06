/**
 * The 6 fixed Wavelength categories and 2 fixed question types (ARCHITECTURE.md §3).
 * These are a closed set, mirrored 1:1 by the `wavelength_category` and
 * `question_type` Postgres enums — the database is authoritative; this file
 * exists only so the UI and validation layers share one definition.
 *
 * MVP scope: `situation` has been removed as a question type. A question's
 * category is chosen individually per question (there is no upfront
 * "pick your categories" step, and no cap tied to a question count) — the
 * set of categories a Wavelength ends up using is simply whichever ones its
 * questions happen to use.
 */

export const CATEGORIES = [
  "relationship",
  "lifestyle",
  "money",
  "adventures_travel",
  "future",
  "values_priorities",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  relationship: "Relationship",
  lifestyle: "Lifestyle",
  money: "Money",
  adventures_travel: "Adventures & Travel",
  future: "Future",
  values_priorities: "Values & Priorities",
};

export const QUESTION_TYPES = ["choice", "scale"] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  choice: "Choice",
  scale: "Scale / Importance",
};

/**
 * Question count is a range, not a target: A never declares up front how
 * many questions the Wavelength will have. 5 is the minimum needed to
 * finalize, 12 is the hard maximum, and 8 is shown only as a friendly
 * recommendation — never a requirement (resolved decision, replaces the
 * earlier "declare a count upfront" design).
 */
export const MIN_QUESTIONS = 5;
export const MAX_QUESTIONS = 12;
export const RECOMMENDED_QUESTION_COUNT = 8;

export const MIN_CHOICE_OPTIONS = 2;
export const MAX_CHOICE_OPTIONS = 5;

/**
 * A `choice` question's `options` column has a hard DB-level floor: the
 * `questions_validate_options` trigger (20260904120300_functions_and_triggers.sql)
 * rejects any option whose *trimmed* text is empty — there is no such thing
 * as a stored, genuinely blank choice option. That trigger is shared,
 * production-applied validation and is not something this constant works
 * around or weakens.
 *
 * A ready-made game whose question text is fixed in advance but whose
 * *options* A has not written yet (see lib/wavelength/ready-made-games.ts's
 * "How Well Do You Know Me?") still needs something structurally valid to
 * seed those two required option slots with. U+00A0 (no-break space) is
 * that placeholder: it satisfies the trigger (Postgres' `btrim` only strips
 * the plain ASCII space, so it isn't trimmed away to nothing), while
 * reading as empty everywhere the UI or validation actually cares — JS's
 * `.trim()` (used by question-edit-form.tsx's slot rendering,
 * question-card.tsx's "has A written real options yet" check, and
 * lib/validation/schemas.ts's own option parsing) *does* strip it, so it's
 * never mistaken for real, A-authored content, never shown as visible text,
 * and never reaches B.
 */
export const UNWRITTEN_OPTION = " ";

/**
 * The one place that decides what an option field should *display* for a
 * given stored option value: the sentinel reads as a genuinely blank,
 * editable field (same as a freshly added slot); real, A-authored text
 * (anything else) is shown exactly as stored, unchanged. Bug fix: this
 * used to be inlined as a ternary inside question-edit-form.tsx's
 * `initialSlots`, computed once at mount and fed into an *uncontrolled*
 * `defaultValue` — which meant a value this function correctly produced
 * could still end up visually discarded later (see that file's own doc
 * comment on why the field must be controlled, not this function). Having
 * one named, exported, pure function for the sentinel-to-blank mapping —
 * rather than re-deriving it ad hoc wherever an option is displayed —
 * is what keeps "is this option still unwritten?" consistent and
 * unit-testable on its own, independent of how/when it gets rendered.
 */
export function optionDisplayValue(storedValue: string): string {
  return storedValue === UNWRITTEN_OPTION ? "" : storedValue;
}

/**
 * Fixed 5-level scale, used verbatim for every `scale` question — never
 * per-question data. The stored/compared value IS the percentage (0, 25,
 * 50, 75, 100), not a 1-5 index — see lib/scoring/score.ts, whose scale
 * scoring formula (`100 - |A - B|`) depends directly on these being the
 * actual values, not levels that need translating.
 */
export const SCALE_VALUES = [0, 25, 50, 75, 100] as const;

export type ScaleValue = (typeof SCALE_VALUES)[number];

export const SCALE_LABELS: Record<ScaleValue, string> = {
  0: "Not important",
  25: "Slightly important",
  50: "Moderately important",
  75: "Very important",
  100: "Extremely important",
};
