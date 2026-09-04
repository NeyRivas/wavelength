/**
 * Deterministic scoring engine (ARCHITECTURE.md §8). Pure TypeScript, no
 * AI, no I/O, no persistence — every function here is a plain
 * input-in/value-out computation over already-fetched questions/answers,
 * and is meant to be re-run on every result view rather than cached
 * anywhere (source of truth stays Questions + Answers + Scoring Rules).
 *
 * Scoring rules (approved, unchanged from ARCHITECTURE.md §8):
 *   - choice / situation: same option = 100, different option = 0
 *   - scale: |difference| 0→100, 1→75, 2→50, 3→25, 4→0
 *   - global score: simple average of every question's score, equal weight
 *   - category score: simple average of that category's question scores,
 *     equal weight
 *   - alignment level: 75-100 High, 50-74 Mixed, 0-49 Low, decided from the
 *     *rounded* integer so the label always matches what's displayed
 *   - percentages are integers, rounded round-half-up
 *
 * Out of scope here (a later, Result-rendering phase's job, not scoring):
 * sorting categories high-to-low, picking the top-3 "Where You're Aligned"
 * questions, grouping "Different Wavelengths", grouping questions by
 * category for display. This module only produces the numbers those views
 * need — including each question's original `orderIndex`, preserved
 * end-to-end so that later tie-breaking ("ties keep original question
 * order") never has to re-derive it.
 */

import type { Category, QuestionType } from "../wavelength/categories";

export type Participant = "A" | "B";

export type AlignmentLevel = "High Alignment" | "Mixed Alignment" | "Low Alignment";

/**
 * A question as scoring needs to see it — deliberately decoupled from the
 * DB row shape so this module has zero Supabase/DB dependency. `choice`
 * and `situation` carry `optionCount` (their answer values are option
 * indices, 0-based, and need a range to validate against); `scale` doesn't
 * — its range (1-5) is fixed and universal.
 */
export type ScoringQuestion = { id: string; category: Category; orderIndex: number } & (
  | { type: Extract<QuestionType, "choice" | "situation">; optionCount: number }
  | { type: Extract<QuestionType, "scale"> }
);

/**
 * One participant's answer to one question.
 *  - choice / situation: 0-based index into that question's options
 *  - scale: integer 1-5
 */
export interface ScoringAnswer {
  questionId: string;
  participant: Participant;
  value: number;
}

export interface QuestionScore {
  questionId: string;
  category: Category;
  orderIndex: number;
  /** Integer 0-100. */
  score: number;
}

export interface CategoryScore {
  category: Category;
  /** Integer 0-100. */
  score: number;
  level: AlignmentLevel;
  questionCount: number;
}

export interface WavelengthResult {
  global: { score: number; level: AlignmentLevel };
  /** In question order, first-appearance per category — NOT sorted by
   * score. Sorting "highest alignment first" is a Result-screen concern. */
  categories: CategoryScore[];
  /** In original question order (by `orderIndex`) — NOT sorted by score. */
  questions: QuestionScore[];
}

// ── errors ──────────────────────────────────────────────────────────────

export class ScoringError extends Error {}

export class MissingAnswerError extends ScoringError {
  constructor(questionId: string, participant: Participant) {
    super(`missing participant ${participant}'s answer for question ${questionId}`);
    this.name = "MissingAnswerError";
  }
}

export class DuplicateAnswerError extends ScoringError {
  constructor(questionId: string, participant: Participant) {
    super(`duplicate answer for question ${questionId}, participant ${participant}`);
    this.name = "DuplicateAnswerError";
  }
}

export class UnknownQuestionError extends ScoringError {
  constructor(questionId: string) {
    super(`answer references a question that was not provided: ${questionId}`);
    this.name = "UnknownQuestionError";
  }
}

export class DuplicateQuestionError extends ScoringError {
  constructor(questionId: string) {
    super(`question ${questionId} was provided more than once`);
    this.name = "DuplicateQuestionError";
  }
}

export class InvalidAnswerValueError extends ScoringError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAnswerValueError";
  }
}

// ── rounding ────────────────────────────────────────────────────────────

/**
 * Round-half-up (not banker's rounding, not JS's occasionally-surprising
 * float behavior on negatives — irrelevant here since every score is
 * already >=0). 74.5 -> 75, 49.5 -> 50.
 */
export function roundHalfUp(value: number): number {
  return Math.floor(value + 0.5);
}

// ── per-question scoring ───────────────────────────────────────────────

const SCALE_DIFF_TO_SCORE = [100, 75, 50, 25, 0] as const;

/** Validates a single answer value against its question's type/range.
 * Throws `InvalidAnswerValueError` rather than returning a boolean — an
 * out-of-range or non-integer value here always indicates a caller bug
 * (the database's own constraints already prevent this for real data), so
 * failing loudly is more useful than silently coercing or ignoring it. */
export function validateAnswerValue(question: ScoringQuestion, value: number): void {
  if (!Number.isInteger(value)) {
    throw new InvalidAnswerValueError(
      `answer value for question ${question.id} must be an integer, got ${value}`,
    );
  }

  if (question.type === "scale") {
    if (value < 1 || value > 5) {
      throw new InvalidAnswerValueError(
        `scale answer for question ${question.id} must be between 1 and 5, got ${value}`,
      );
    }
    return;
  }

  if (value < 0 || value >= question.optionCount) {
    throw new InvalidAnswerValueError(
      `option index for question ${question.id} must be between 0 and ${question.optionCount - 1}, got ${value}`,
    );
  }
}

/**
 * The score (0-100) for a single question, given both participants'
 * already-validated answer values. Exported directly so every rule
 * (choice/situation equality, each scale difference 0-4) is independently
 * testable without going through the aggregate pipeline.
 */
export function scoreQuestion(question: ScoringQuestion, valueA: number, valueB: number): number {
  if (question.type === "choice" || question.type === "situation") {
    return valueA === valueB ? 100 : 0;
  }

  const diff = Math.abs(valueA - valueB);
  const score = SCALE_DIFF_TO_SCORE[diff];
  if (score === undefined) {
    // Unreachable once values have passed validateAnswerValue (1-5 each
    // bounds diff to 0-4), but scoreQuestion is a public function that can
    // be called directly — kept as a defensive, clearly-labeled guard.
    throw new InvalidAnswerValueError(
      `scale difference out of range for question ${question.id}: ${diff}`,
    );
  }
  return score;
}

/**
 * Per-question scores for a full questionnaire. Requires every question to
 * have exactly one A and one B answer ("questions with valid answers
 * only") — throws rather than skipping incomplete/malformed input, since a
 * partial or corrupt result must never be silently produced.
 */
export function computeQuestionScores(
  questions: ScoringQuestion[],
  answers: ScoringAnswer[],
): QuestionScore[] {
  if (questions.length === 0) {
    throw new ScoringError("cannot score a questionnaire with zero questions");
  }

  const questionsById = new Map<string, ScoringQuestion>();
  for (const question of questions) {
    if (questionsById.has(question.id)) {
      throw new DuplicateQuestionError(question.id);
    }
    questionsById.set(question.id, question);
  }

  const answersByKey = new Map<string, ScoringAnswer>();
  for (const answer of answers) {
    if (!questionsById.has(answer.questionId)) {
      throw new UnknownQuestionError(answer.questionId);
    }
    const key = `${answer.questionId}:${answer.participant}`;
    if (answersByKey.has(key)) {
      throw new DuplicateAnswerError(answer.questionId, answer.participant);
    }
    answersByKey.set(key, answer);
  }

  // Original question order drives everything downstream — see the
  // orderIndex doc comments on ScoringQuestion / QuestionScore.
  const orderedQuestions = [...questions].sort((a, b) => a.orderIndex - b.orderIndex);

  return orderedQuestions.map((question) => {
    const answerA = answersByKey.get(`${question.id}:A`);
    const answerB = answersByKey.get(`${question.id}:B`);

    if (!answerA) throw new MissingAnswerError(question.id, "A");
    if (!answerB) throw new MissingAnswerError(question.id, "B");

    validateAnswerValue(question, answerA.value);
    validateAnswerValue(question, answerB.value);

    return {
      questionId: question.id,
      category: question.category,
      orderIndex: question.orderIndex,
      score: scoreQuestion(question, answerA.value, answerB.value),
    };
  });
}

// ── aggregation ─────────────────────────────────────────────────────────

function average(scores: number[]): number {
  const sum = scores.reduce((total, score) => total + score, 0);
  return roundHalfUp(sum / scores.length);
}

/** Global score: simple average across every question, equal weight. */
export function computeGlobalScore(questionScores: QuestionScore[]): number {
  if (questionScores.length === 0) {
    throw new ScoringError("cannot compute a global score with zero questions");
  }
  return average(questionScores.map((q) => q.score));
}

/**
 * Category scores: simple average of each category's questions, equal
 * weight. Only categories actually present in `questionScores` are
 * returned — resolved decision ARCHITECTURE.md §13.A already guarantees
 * every category A selected has >=1 question, so this is never a "missing
 * category" concern in practice.
 *
 * Order: first appearance in `questionScores` (i.e. original question
 * order), NOT sorted by score — sorting "highest alignment first" is a
 * Result-screen concern, out of scope for this module.
 */
export function computeCategoryScores(questionScores: QuestionScore[]): CategoryScore[] {
  const byCategory = new Map<Category, number[]>();
  for (const q of questionScores) {
    const scores = byCategory.get(q.category);
    if (scores) {
      scores.push(q.score);
    } else {
      byCategory.set(q.category, [q.score]);
    }
  }

  return [...byCategory.entries()].map(([category, scores]) => {
    const score = average(scores);
    return { category, score, level: alignmentLevel(score), questionCount: scores.length };
  });
}

/**
 * 75-100 High Alignment, 50-74 Mixed Alignment, 0-49 Low Alignment. Always
 * applied to the already-rounded integer score, so the label shown next to
 * a percentage never contradicts it (e.g. a raw 74.6% that rounds to 75%
 * is labeled High, not Mixed).
 */
export function alignmentLevel(score: number): AlignmentLevel {
  if (!Number.isInteger(score) || score < 0 || score > 100) {
    throw new ScoringError(`alignment level requires an integer score 0-100, got ${score}`);
  }
  if (score >= 75) return "High Alignment";
  if (score >= 50) return "Mixed Alignment";
  return "Low Alignment";
}

/**
 * The full result for a completed Wavelength: global score/level, every
 * used category's score/level, and every question's score — everything a
 * later Result-rendering phase needs, with nothing sorted, grouped, or
 * filtered for display yet. Computed fresh every call; nothing here is
 * persisted (ARCHITECTURE.md §8).
 */
export function computeWavelengthResult(
  questions: ScoringQuestion[],
  answers: ScoringAnswer[],
): WavelengthResult {
  const questionScores = computeQuestionScores(questions, answers);
  const globalScore = computeGlobalScore(questionScores);

  return {
    global: { score: globalScore, level: alignmentLevel(globalScore) },
    categories: computeCategoryScores(questionScores),
    questions: questionScores,
  };
}
