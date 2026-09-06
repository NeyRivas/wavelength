/**
 * Result presentation layer (ARCHITECTURE.md §12 Phase 6, and the "Out of
 * scope" note at the top of lib/scoring/score.ts). Scoring itself — every
 * number here — comes from `computeWavelengthResult` unchanged; this
 * module only maps DB rows into that function's input shape, joins the
 * scores back to human-readable question/answer text, and does the
 * presentation-only sorting/selection/grouping the result screens need
 * (top-3, differences, category grouping). No scoring rule is
 * reimplemented or altered here.
 *
 * Nothing here is persisted — computed fresh from Questions + Answers on
 * every call, per the approved "no results table" rule (ARCHITECTURE.md
 * §10). Deterministic: the same rows always produce the same view, thanks
 * to `computeWavelengthResult`'s determinism plus JS's stable `Array.sort`
 * used throughout for tie-breaking by original question order.
 */

import {
  computeWavelengthResult,
  type AlignmentLevel,
  type ScoringAnswer,
  type ScoringQuestion,
} from "../scoring/score";
import {
  SCALE_LABELS,
  SCALE_VALUES,
  type Category,
  type QuestionType,
  type ScaleValue,
} from "./categories";

export interface ResultQuestionRow {
  id: string;
  category: Category;
  type: QuestionType;
  text: string;
  options: string[] | null;
  order_index: number;
}

export interface ResultAnswerRow {
  question_id: string;
  participant: "A" | "B";
  value: number;
}

export interface DisplayQuestion {
  id: string;
  category: Category;
  text: string;
  orderIndex: number;
  /** Integer 0-100. */
  score: number;
  /** Human-readable, never a raw index/number — the option text for
   * choice/situation, the fixed 1-5 label for scale. */
  answerA: string;
  answerB: string;
}

export interface CategoryResult {
  category: Category;
  score: number;
  level: AlignmentLevel;
  /** This category's questions, highest alignment first; ties preserve
   * original question order. */
  questions: DisplayQuestion[];
}

export interface WavelengthResultView {
  global: { score: number; level: AlignmentLevel };
  /** Highest alignment first; ties preserve original category order
   * (derived from original question order — see buildWavelengthResultView). */
  categories: CategoryResult[];
  /** Exactly the top 3 by alignment (or all of them, if fewer than 3
   * questions exist) — regardless of category, ties preserve original
   * question order. */
  whereAligned: DisplayQuestion[];
  /** Every question with any difference (score < 100), lowest alignment
   * first, ties preserve original question order. Never framed as
   * negative — that's a presentation-copy concern, handled by the
   * component that renders this, not this data. */
  differentWavelengths: DisplayQuestion[];
  /** Every question, in original questionnaire order — the input to the
   * "All questions grouped by category" section (grouping itself is what
   * `categories[].questions` already provides). */
  allQuestions: DisplayQuestion[];
}

/** The scale value domain is a fixed, closed set (lib/wavelength/categories.ts
 * SCALE_VALUES) — this narrows an arbitrary DB integer to that literal
 * union, falling back to the raw number only if it's ever somehow out of
 * range (defensive; `validateAnswerValue` already guarantees this for real
 * data). */
function isScaleValue(value: number): value is ScaleValue {
  return (SCALE_VALUES as readonly number[]).includes(value);
}

export function formatAnswer(
  question: Pick<ResultQuestionRow, "type" | "options">,
  value: number,
): string {
  if (question.type === "scale") {
    return isScaleValue(value) ? SCALE_LABELS[value] : String(value);
  }
  return question.options?.[value] ?? String(value);
}

export class ResultDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResultDataError";
  }
}

/**
 * Builds the complete result view from the raw DB rows for a COMPLETED
 * wavelength. Throws `ResultDataError` (wrapping whatever
 * `computeWavelengthResult` raised) if the data is somehow incomplete or
 * malformed — this should be unreachable for a genuinely COMPLETED
 * wavelength (the state trigger guarantees every question has both
 * participants' valid answers before allowing that transition), but the
 * caller should catch this and fail safely rather than crash or leak a raw
 * DB/internal error.
 */
export function buildWavelengthResultView(
  questions: ResultQuestionRow[],
  answers: ResultAnswerRow[],
): WavelengthResultView {
  const scoringQuestions: ScoringQuestion[] = questions.map((q) =>
    q.type === "scale"
      ? { id: q.id, category: q.category, orderIndex: q.order_index, type: "scale" }
      : {
          id: q.id,
          category: q.category,
          orderIndex: q.order_index,
          type: q.type,
          optionCount: q.options?.length ?? 0,
        },
  );
  const scoringAnswers: ScoringAnswer[] = answers.map((a) => ({
    questionId: a.question_id,
    participant: a.participant,
    value: a.value,
  }));

  let result;
  try {
    result = computeWavelengthResult(scoringQuestions, scoringAnswers);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown scoring error";
    throw new ResultDataError(`could not compute result: ${message}`);
  }

  const questionById = new Map(questions.map((q) => [q.id, q]));
  const answerValue = new Map(answers.map((a) => [`${a.question_id}:${a.participant}`, a.value]));

  // result.questions is already in original order_index order (scoring
  // engine's own guarantee) — everything below relies on that plus a
  // stable sort to preserve original order among ties, rather than
  // re-deriving order from scratch.
  const allQuestions: DisplayQuestion[] = result.questions.map((qs) => {
    const question = questionById.get(qs.questionId);
    const valueA = answerValue.get(`${qs.questionId}:A`);
    const valueB = answerValue.get(`${qs.questionId}:B`);
    if (!question || valueA === undefined || valueB === undefined) {
      // computeWavelengthResult already guarantees every question has both
      // answers; reaching here would mean these two id-keyed lookups
      // somehow disagree with what it validated — a caller bug, not bad
      // user data. Fail loudly rather than render a blank answer.
      throw new ResultDataError(`missing question/answer data for question ${qs.questionId}`);
    }
    return {
      id: qs.questionId,
      category: qs.category,
      text: question.text,
      orderIndex: qs.orderIndex,
      score: qs.score,
      answerA: formatAnswer(question, valueA),
      answerB: formatAnswer(question, valueB),
    };
  });

  // "Where You're Aligned": top 3, any category, ties preserve original
  // order — Array.sort is a stable sort (guaranteed since ES2019), and
  // allQuestions is already in original order, so a plain descending sort
  // here is sufficient for the tie-break rule without extra bookkeeping.
  const whereAligned = [...allQuestions].sort((a, b) => b.score - a.score).slice(0, 3);

  // "Different Wavelengths": every question with a difference (score < 100
  // means at least one point of disagreement — for choice/situation that's
  // the only possible non-match value; for scale it's any nonzero
  // difference), lowest alignment first, ties preserve original order.
  const differentWavelengths = allQuestions
    .filter((q) => q.score < 100)
    .sort((a, b) => a.score - b.score);

  // Category order tie-break: "original category order" is derived from
  // original *question* order (ARCHITECTURE.md doesn't define a separate
  // standalone category ordering) — a category's tie-break rank is the
  // order_index of the first question in it.
  const categoryFirstOrderIndex = new Map<Category, number>();
  for (const q of allQuestions) {
    if (!categoryFirstOrderIndex.has(q.category)) {
      categoryFirstOrderIndex.set(q.category, q.orderIndex);
    }
  }

  const categories: CategoryResult[] = result.categories
    .map((c) => ({
      category: c.category,
      score: c.score,
      level: c.level,
      questions: allQuestions
        .filter((q) => q.category === c.category)
        .sort((a, b) => b.score - a.score), // stable -> ties preserve original order
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aIndex = categoryFirstOrderIndex.get(a.category) ?? 0;
      const bIndex = categoryFirstOrderIndex.get(b.category) ?? 0;
      return aIndex - bIndex;
    });

  return {
    global: result.global,
    categories,
    whereAligned,
    differentWavelengths,
    allQuestions,
  };
}

/** Short, non-clinical interpretation text per level — never framed as
 * scientific, predictive, diagnostic, or statistically validated (approved
 * constraint). Differences are framed as information, not a verdict. */
export const ALIGNMENT_INTERPRETATION: Record<AlignmentLevel, string> = {
  "High Alignment": "You see most things the same way — you're clearly on the same wavelength.",
  "Mixed Alignment":
    "You're aligned on plenty and see some things differently — a mix worth exploring together.",
  "Low Alignment":
    "You see many things differently. That's simply information about where you differ, not a verdict.",
};
