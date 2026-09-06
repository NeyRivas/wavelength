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
 * Fixed 5-level scale, used verbatim for every `scale` question — never
 * per-question data. The stored/compared value IS the percentage (0, 25,
 * 50, 75, 100), not a 1-5 index — see lib/scoring/score.ts, whose scale
 * scoring formula (`100 - |A - B|`) depends directly on these being the
 * actual values, not levels that need translating.
 */
export const SCALE_VALUES = [0, 25, 50, 75, 100] as const;

export type ScaleValue = (typeof SCALE_VALUES)[number];

export const SCALE_LABELS: Record<ScaleValue, string> = {
  0: "Nada importante",
  25: "Poco importante",
  50: "Moderadamente importante",
  75: "Muy importante",
  100: "Extremadamente importante",
};
