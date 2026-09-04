/**
 * The 6 fixed Wavelength categories and 3 fixed question types (ARCHITECTURE.md §3).
 * These are a closed set, mirrored 1:1 by the `wavelength_category` and
 * `question_type` Postgres enums — the database is authoritative; this file
 * exists only so the (future) UI and validation layers share one definition.
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

export const MIN_CATEGORIES = 1;
export const MAX_CATEGORIES = 6;

export const QUESTION_TYPES = ["choice", "scale", "situation"] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  choice: "Choice",
  situation: "Situation",
  scale: "Scale / Importance",
};

export const MIN_QUESTIONS = 5;
export const MAX_QUESTIONS = 12;
export const DEFAULT_QUESTION_COUNT = 8;

export const MIN_CHOICE_OPTIONS = 2;
export const MAX_CHOICE_OPTIONS = 5;

/** Fixed 1–5 scale labels, used verbatim for every `scale` question — never per-question data. */
export const SCALE_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "Nada importante",
  2: "Poco importante",
  3: "Moderadamente importante",
  4: "Muy importante",
  5: "Esencial",
};

/**
 * The category picker is capped by the chosen question count, so every
 * selected category is guaranteed at least one question (resolved decision,
 * ARCHITECTURE.md §13.A) — enforced here for the UI and again as a DB check
 * constraint (`array_length(categories,1) <= question_count`).
 */
export function maxSelectableCategories(questionCount: number): number {
  return Math.min(MAX_CATEGORIES, questionCount);
}
