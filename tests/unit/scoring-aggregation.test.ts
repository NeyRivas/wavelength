import { describe, expect, it } from "vitest";

import {
  DuplicateAnswerError,
  DuplicateQuestionError,
  MissingAnswerError,
  ScoringError,
  UnknownQuestionError,
  alignmentLevel,
  computeCategoryScores,
  computeGlobalScore,
  computeQuestionScores,
  computeWavelengthResult,
  roundHalfUp,
  type QuestionScore,
  type ScoringAnswer,
  type ScoringQuestion,
} from "../../lib/scoring/score";

function qs(overrides: Partial<QuestionScore> & { score: number }): QuestionScore {
  return {
    questionId: "q",
    category: "relationship",
    orderIndex: 0,
    ...overrides,
  };
}

// ── roundHalfUp ────────────────────────────────────────────────────────

describe("roundHalfUp", () => {
  it("rounds .5 up, not to even (not banker's rounding)", () => {
    expect(roundHalfUp(74.5)).toBe(75);
    expect(roundHalfUp(49.5)).toBe(50);
    expect(roundHalfUp(2.5)).toBe(3);
  });

  it("rounds down below .5", () => {
    expect(roundHalfUp(66.4)).toBe(66);
    expect(roundHalfUp(33.33)).toBe(33);
  });

  it("rounds up above .5", () => {
    expect(roundHalfUp(66.67)).toBe(67);
  });

  it("leaves whole numbers unchanged", () => {
    expect(roundHalfUp(0)).toBe(0);
    expect(roundHalfUp(100)).toBe(100);
    expect(roundHalfUp(75)).toBe(75);
  });
});

// ── alignmentLevel ─────────────────────────────────────────────────────

describe("alignmentLevel: boundaries", () => {
  it("49 is Low, 50 is Mixed (the 49/50 boundary)", () => {
    expect(alignmentLevel(49)).toBe("Low Alignment");
    expect(alignmentLevel(50)).toBe("Mixed Alignment");
  });

  it("74 is Mixed, 75 is High (the 74/75 boundary)", () => {
    expect(alignmentLevel(74)).toBe("Mixed Alignment");
    expect(alignmentLevel(75)).toBe("High Alignment");
  });

  it("covers the extremes", () => {
    expect(alignmentLevel(0)).toBe("Low Alignment");
    expect(alignmentLevel(100)).toBe("High Alignment");
  });

  it("rejects a non-integer or out-of-range score", () => {
    expect(() => alignmentLevel(74.5)).toThrow(ScoringError);
    expect(() => alignmentLevel(-1)).toThrow(ScoringError);
    expect(() => alignmentLevel(101)).toThrow(ScoringError);
  });
});

// ── computeGlobalScore ─────────────────────────────────────────────────

describe("computeGlobalScore", () => {
  it("is a simple, equally-weighted average", () => {
    expect(computeGlobalScore([qs({ score: 100 }), qs({ score: 0 })])).toBe(50);
    expect(computeGlobalScore([qs({ score: 100 }), qs({ score: 100 }), qs({ score: 0 })])).toBe(
      67, // 66.67 -> round-half-up -> 67
    );
  });

  it("round-half-up lands exactly on the High Alignment boundary", () => {
    // (100 + 49) / 2 = 74.5 -> 75
    expect(computeGlobalScore([qs({ score: 100 }), qs({ score: 49 })])).toBe(75);
  });

  it("round-half-up lands exactly on the Mixed Alignment boundary", () => {
    // (0 + 99) / 2 = 49.5 -> 50
    expect(computeGlobalScore([qs({ score: 0 }), qs({ score: 99 })])).toBe(50);
  });

  it("handles a single question (the average is just that score)", () => {
    expect(computeGlobalScore([qs({ score: 75 })])).toBe(75);
  });

  it("throws for zero questions rather than dividing by zero", () => {
    expect(() => computeGlobalScore([])).toThrow(ScoringError);
  });
});

// ── computeCategoryScores ──────────────────────────────────────────────

describe("computeCategoryScores", () => {
  it("averages only within each category, independently", () => {
    const scores = [
      qs({ questionId: "1", category: "relationship", score: 100 }),
      qs({ questionId: "2", category: "relationship", score: 0 }),
      qs({ questionId: "3", category: "money", score: 75 }),
    ];
    const categories = computeCategoryScores(scores);

    const relationship = categories.find((c) => c.category === "relationship");
    const money = categories.find((c) => c.category === "money");

    expect(relationship).toEqual({
      category: "relationship",
      score: 50,
      level: "Mixed Alignment",
      questionCount: 2,
    });
    expect(money).toEqual({
      category: "money",
      score: 75,
      level: "High Alignment",
      questionCount: 1,
    });
  });

  it("every question carries equal weight within a category regardless of question type", () => {
    // 3 scores that are not evenly divisible, to prove no hidden weighting.
    const scores = [
      qs({ questionId: "1", category: "future", score: 100 }),
      qs({ questionId: "2", category: "future", score: 100 }),
      qs({ questionId: "3", category: "future", score: 0 }),
    ];
    expect(computeCategoryScores(scores)[0]?.score).toBe(67);
  });

  it("only includes categories actually present", () => {
    const categories = computeCategoryScores([qs({ category: "future", score: 80 })]);
    expect(categories).toHaveLength(1);
    expect(categories[0]?.category).toBe("future");
  });

  it("returns an empty list for an empty input, without throwing", () => {
    expect(computeCategoryScores([])).toEqual([]);
  });
});

// ── computeQuestionScores: order, completeness, malformed input ───────

const baseQuestions: ScoringQuestion[] = [
  { id: "q1", category: "relationship", orderIndex: 0, type: "choice", optionCount: 2 },
  { id: "q2", category: "money", orderIndex: 1, type: "situation", optionCount: 3 },
  { id: "q3", category: "future", orderIndex: 2, type: "scale" },
];

function fullAnswers(): ScoringAnswer[] {
  return [
    { questionId: "q1", participant: "A", value: 0 },
    { questionId: "q1", participant: "B", value: 0 },
    { questionId: "q2", participant: "A", value: 1 },
    { questionId: "q2", participant: "B", value: 2 },
    { questionId: "q3", participant: "A", value: 1 },
    { questionId: "q3", participant: "B", value: 5 },
  ];
}

describe("computeQuestionScores", () => {
  it("scores every question correctly and preserves original order (orderIndex)", () => {
    const scores = computeQuestionScores(baseQuestions, fullAnswers());
    expect(scores.map((s) => s.questionId)).toEqual(["q1", "q2", "q3"]);
    expect(scores.map((s) => s.orderIndex)).toEqual([0, 1, 2]);
    expect(scores).toEqual([
      { questionId: "q1", category: "relationship", orderIndex: 0, score: 100 }, // same choice
      { questionId: "q2", category: "money", orderIndex: 1, score: 0 }, // different situation
      { questionId: "q3", category: "future", orderIndex: 2, score: 0 }, // scale diff 4
    ]);
  });

  it("preserves original order even when questions are passed out of order", () => {
    const shuffled = [baseQuestions[2]!, baseQuestions[0]!, baseQuestions[1]!];
    const scores = computeQuestionScores(shuffled, fullAnswers());
    expect(scores.map((s) => s.questionId)).toEqual(["q1", "q2", "q3"]);
  });

  it("throws MissingAnswerError when A hasn't answered a question", () => {
    const answers = fullAnswers().filter((a) => !(a.questionId === "q2" && a.participant === "A"));
    expect(() => computeQuestionScores(baseQuestions, answers)).toThrow(MissingAnswerError);
  });

  it("throws MissingAnswerError when B hasn't answered a question", () => {
    const answers = fullAnswers().filter((a) => !(a.questionId === "q3" && a.participant === "B"));
    expect(() => computeQuestionScores(baseQuestions, answers)).toThrow(MissingAnswerError);
  });

  it("throws DuplicateAnswerError when the same participant answers a question twice", () => {
    const answers = [...fullAnswers(), { questionId: "q1", participant: "A" as const, value: 1 }];
    expect(() => computeQuestionScores(baseQuestions, answers)).toThrow(DuplicateAnswerError);
  });

  it("throws UnknownQuestionError when an answer references a question not in the list", () => {
    const answers = [
      ...fullAnswers(),
      { questionId: "q-does-not-exist", participant: "A" as const, value: 0 },
    ];
    expect(() => computeQuestionScores(baseQuestions, answers)).toThrow(UnknownQuestionError);
  });

  it("throws DuplicateQuestionError when the same question id is provided twice", () => {
    const questions = [...baseQuestions, baseQuestions[0]!];
    expect(() => computeQuestionScores(questions, fullAnswers())).toThrow(DuplicateQuestionError);
  });

  it("throws for an out-of-range answer value (propagated from validateAnswerValue)", () => {
    const answers = fullAnswers().map((a) =>
      a.questionId === "q1" && a.participant === "B" ? { ...a, value: 9 } : a,
    );
    expect(() => computeQuestionScores(baseQuestions, answers)).toThrow();
  });

  it("throws for zero questions", () => {
    expect(() => computeQuestionScores([], [])).toThrow(ScoringError);
  });
});

// ── computeWavelengthResult: end-to-end ────────────────────────────────

describe("computeWavelengthResult", () => {
  it("produces global, per-category, and per-question results consistently", () => {
    const result = computeWavelengthResult(baseQuestions, fullAnswers());

    // q1=100, q2=0, q3=0 -> average 33.33 -> 33
    expect(result.global).toEqual({ score: 33, level: "Low Alignment" });

    expect(result.questions).toHaveLength(3);
    expect(result.questions.map((q) => q.score)).toEqual([100, 0, 0]);

    expect(result.categories).toEqual(
      expect.arrayContaining([
        { category: "relationship", score: 100, level: "High Alignment", questionCount: 1 },
        { category: "money", score: 0, level: "Low Alignment", questionCount: 1 },
        { category: "future", score: 0, level: "Low Alignment", questionCount: 1 },
      ]),
    );
  });

  it("is deterministic — the same input always produces the same output", () => {
    const a = computeWavelengthResult(baseQuestions, fullAnswers());
    const b = computeWavelengthResult(baseQuestions, fullAnswers());
    expect(a).toEqual(b);
  });
});
