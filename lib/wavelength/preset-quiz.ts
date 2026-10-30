import { normalizeText } from "@/lib/validation/schemas";

import { MAX_CHOICE_OPTIONS, MIN_CHOICE_OPTIONS, UNWRITTEN_OPTION } from "./categories";
import type { ReadyMadeGame } from "./ready-made-games";

/**
 * The guided, one-question-at-a-time quiz for ready-made scored games
 * (components/quiz/quiz-stepper.tsx). Pure decisions only — which games
 * use it, where a participant resumes, and how A's own written answer
 * options are cleaned up before saving — so they can be tested without a
 * browser or a database.
 *
 * Nothing here changes what gets stored: the stepper saves through the
 * same Server Actions as the builder (saveAnswerA / saveAnswerB /
 * updateQuestion), and the database's own triggers stay the authority on
 * what's valid.
 */

/** Every ready-made game with a fixed, scored question set plays in the
 * guided quiz. Conversation experiences (36 Questions) have their own
 * stepper, and games with no questions (Date Night) never reach /create. */
export function isPresetQuizGame(game: ReadyMadeGame | undefined): game is ReadyMadeGame {
  return !!game && game.questions !== null && !game.conversation;
}

/** Games whose questions ship without answer options (How Well Do You
 * Know Me?, Friendship Check): A writes their own options for every
 * question and marks the real one. */
export function presetWritesOwnOptions(game: ReadyMadeGame): boolean {
  return !!game.questions?.some((question) => question.options?.includes(UNWRITTEN_OPTION));
}

export interface QuizQuestion {
  id: string;
  type: "choice" | "scale";
  text: string;
  options: string[] | null;
}

/** The options A has actually written — UNWRITTEN_OPTION placeholders and
 * blanks don't count (same `.trim()` rule as the builder and validation). */
export function realOptions(options: string[] | null): string[] {
  return (options ?? []).filter((option) => option.trim().length > 0);
}

/** Whether A answers this question by writing options rather than picking
 * one: always in a game where A writes their own options, and as a
 * fallback for any choice question that doesn't have enough options yet
 * (e.g. one emptied in the editor). */
export function needsWrittenOptions(question: QuizQuestion, writesOwnOptions: boolean): boolean {
  return (
    question.type === "choice" &&
    (writesOwnOptions || realOptions(question.options).length < MIN_CHOICE_OPTIONS)
  );
}

/** Where to resume: the first question without a saved answer, or -1
 * when every question is answered. */
export function firstUnansweredIndex(
  questions: { id: string }[],
  answers: Record<string, number>,
): number {
  return questions.findIndex((question) => answers[question.id] === undefined);
}

export type WrittenOptionsResult =
  { ok: true; options: string[]; answerIndex: number } | { ok: false; error: string };

export const WRITTEN_OPTIONS_ERRORS = {
  tooFew: `Write at least ${MIN_CHOICE_OPTIONS} possible answers.`,
  tooMany: `You can write up to ${MAX_CHOICE_OPTIONS} possible answers.`,
  duplicate: "Each answer needs to be different.",
  noCorrect: "Mark which answer is the real one.",
} as const;

/**
 * Turns the answer fields A filled in into the options to store and the
 * index of the one marked as real. Empty fields are dropped (so the
 * stored index is the position among the remaining ones), matching the
 * server's own option parsing (lib/validation/schemas.ts).
 */
export function prepareWrittenOptions(
  slots: string[],
  correctSlot: number | null,
): WrittenOptionsResult {
  const filled = slots
    .map((value, slot) => ({ value: value.trim(), slot }))
    .filter((entry) => entry.value.length > 0);

  if (filled.length < MIN_CHOICE_OPTIONS)
    return { ok: false, error: WRITTEN_OPTIONS_ERRORS.tooFew };
  if (filled.length > MAX_CHOICE_OPTIONS) {
    return { ok: false, error: WRITTEN_OPTIONS_ERRORS.tooMany };
  }
  if (new Set(filled.map((entry) => normalizeText(entry.value))).size !== filled.length) {
    return { ok: false, error: WRITTEN_OPTIONS_ERRORS.duplicate };
  }

  const answerIndex = filled.findIndex((entry) => entry.slot === correctSlot);
  if (answerIndex === -1) return { ok: false, error: WRITTEN_OPTIONS_ERRORS.noCorrect };

  return { ok: true, options: filled.map((entry) => entry.value), answerIndex };
}

/** Same options, same order — whether saving them again would be a no-op. */
export function sameOptions(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((option, index) => option === b[index]);
}
