import { describe, expect, it } from "vitest";

import {
  ResultDataError,
  buildWavelengthResultView,
  formatAnswer,
  type ResultAnswerRow,
  type ResultQuestionRow,
} from "../../lib/wavelength/result";

// Fixed dataset, chosen so every rule under test (global/category
// averages, level boundaries, top-3 tie-breaking, different-wavelengths
// selection, category tie-breaking) has a deterministic, hand-checkable
// expected value. MVP scope: only choice/scale exist; scale values are the
// fixed 0/25/50/75/100 domain (see lib/wavelength/categories.ts).
//
// order | id | category      | type      | score
//   0   | q1 | relationship  | choice    | 100  (A=0, B=0 — same option)
//   1   | q2 | money         | choice    |   0  (A=0, B=1 — different)
//   2   | q3 | future        | scale     | 100  (A=50, B=50 — diff 0)
//   3   | q4 | relationship  | scale     |   0  (A=0, B=100 — diff 100)
//   4   | q5 | money         | choice    |   0  (A=0, B=1 — different)
const questions: ResultQuestionRow[] = [
  {
    id: "q1",
    category: "relationship",
    type: "choice",
    text: "Ideal weekend?",
    options: ["Stay in", "Go out"],
    order_index: 0,
  },
  {
    id: "q2",
    category: "money",
    type: "choice",
    text: "Unexpected bonus arrives",
    options: ["Save it", "Spend it", "Invest it"],
    order_index: 1,
  },
  {
    id: "q3",
    category: "future",
    type: "scale",
    text: "Importance of traveling often",
    options: null,
    order_index: 2,
  },
  {
    id: "q4",
    category: "relationship",
    type: "scale",
    text: "Importance of routine",
    options: null,
    order_index: 3,
  },
  {
    id: "q5",
    category: "money",
    type: "choice",
    text: "Splitting the bill?",
    options: ["Always even", "Whoever earns more pays more"],
    order_index: 4,
  },
];

const answers: ResultAnswerRow[] = [
  { question_id: "q1", participant: "A", value: 0 },
  { question_id: "q1", participant: "B", value: 0 },
  { question_id: "q2", participant: "A", value: 0 },
  { question_id: "q2", participant: "B", value: 1 },
  { question_id: "q3", participant: "A", value: 50 },
  { question_id: "q3", participant: "B", value: 50 },
  { question_id: "q4", participant: "A", value: 0 },
  { question_id: "q4", participant: "B", value: 100 },
  { question_id: "q5", participant: "A", value: 0 },
  { question_id: "q5", participant: "B", value: 1 },
];

describe("buildWavelengthResultView: global result", () => {
  it("computes the correct global score and level", () => {
    const view = buildWavelengthResultView(questions, answers);
    // (100 + 0 + 100 + 0 + 0) / 5 = 40
    expect(view.global.score).toBe(40);
    expect(view.global.level).toBe("Low Alignment");
    expect(Number.isInteger(view.global.score)).toBe(true);
  });
});

describe("buildWavelengthResultView: categories", () => {
  it("computes correct per-category scores, levels, and question counts", () => {
    const view = buildWavelengthResultView(questions, answers);
    const byCategory = new Map(view.categories.map((c) => [c.category, c]));

    // relationship: (100 + 0) / 2 = 50 -> Mixed
    expect(byCategory.get("relationship")).toMatchObject({ score: 50, level: "Mixed Alignment" });
    expect(byCategory.get("relationship")?.questions).toHaveLength(2);

    // money: (0 + 0) / 2 = 0 -> Low
    expect(byCategory.get("money")).toMatchObject({ score: 0, level: "Low Alignment" });

    // future: 100 / 1 = 100 -> High
    expect(byCategory.get("future")).toMatchObject({ score: 100, level: "High Alignment" });

    for (const c of view.categories) {
      expect(Number.isInteger(c.score)).toBe(true);
    }
  });

  it("sorts categories highest alignment first", () => {
    const view = buildWavelengthResultView(questions, answers);
    expect(view.categories.map((c) => c.category)).toEqual(["future", "relationship", "money"]);
  });

  it("includes every category actually used, never omitting a low-scoring one", () => {
    const view = buildWavelengthResultView(questions, answers);
    expect(view.categories.map((c) => c.category).sort()).toEqual(
      ["future", "money", "relationship"].sort(),
    );
  });

  it("breaks a category-score tie using the original order of each category's first question", () => {
    // Two single-question categories, both scoring 50 (scale diff 50).
    const tiedQuestions: ResultQuestionRow[] = [
      { id: "m1", category: "money", type: "scale", text: "M", options: null, order_index: 0 },
      { id: "f1", category: "future", type: "scale", text: "F", options: null, order_index: 1 },
    ];
    const tiedAnswers: ResultAnswerRow[] = [
      { question_id: "m1", participant: "A", value: 25 },
      { question_id: "m1", participant: "B", value: 75 }, // diff 50 -> 50
      { question_id: "f1", participant: "A", value: 25 },
      { question_id: "f1", participant: "B", value: 75 }, // diff 50 -> 50
    ];
    const view = buildWavelengthResultView(tiedQuestions, tiedAnswers);
    expect(view.categories.map((c) => c.category)).toEqual(["money", "future"]);
  });

  it("sorts questions within a category highest alignment first, ties preserving original order", () => {
    const view = buildWavelengthResultView(questions, answers);
    const relationship = view.categories.find((c) => c.category === "relationship")!;
    // q1 (order 0, score 100) before q4 (order 3, score 0)
    expect(relationship.questions.map((q) => q.id)).toEqual(["q1", "q4"]);
  });
});

describe("buildWavelengthResultView: Where You're Aligned", () => {
  it("selects exactly the top 3 by score, across all categories, ties preserving original order", () => {
    const view = buildWavelengthResultView(questions, answers);
    // Scores in original order: q1=100, q2=0, q3=100, q4=0, q5=0.
    // q1 and q3 tie at 100 (q1 first, original order); the 3rd slot is a
    // three-way tie at 0 among q2/q4/q5 — q2 wins it for being first.
    expect(view.whereAligned.map((q) => q.id)).toEqual(["q1", "q3", "q2"]);
    expect(view.whereAligned).toHaveLength(3);
  });

  it("shows all available questions when there are fewer than 3", () => {
    const two = questions.slice(0, 2);
    const twoAnswers = answers.filter((a) => a.question_id === "q1" || a.question_id === "q2");
    const view = buildWavelengthResultView(two, twoAnswers);
    expect(view.whereAligned).toHaveLength(2);
  });
});

describe("buildWavelengthResultView: Different Wavelengths", () => {
  it("includes every question with a difference, lowest alignment first, ties preserving original order", () => {
    const view = buildWavelengthResultView(questions, answers);
    // q2, q4, q5 all score 0 — original order preserved among the tie.
    expect(view.differentWavelengths.map((q) => q.id)).toEqual(["q2", "q4", "q5"]);
  });

  it("is empty (not omitted/erroring) when there are no differences at all", () => {
    const perfectAnswers: ResultAnswerRow[] = questions.flatMap((q) => [
      { question_id: q.id, participant: "A" as const, value: q.type === "scale" ? 50 : 0 },
      { question_id: q.id, participant: "B" as const, value: q.type === "scale" ? 50 : 0 },
    ]);
    const view = buildWavelengthResultView(questions, perfectAnswers);
    expect(view.differentWavelengths).toEqual([]);
    expect(view.global.score).toBe(100);
  });
});

describe("buildWavelengthResultView: all questions", () => {
  it("represents every question exactly once, in original order", () => {
    const view = buildWavelengthResultView(questions, answers);
    expect(view.allQuestions).toHaveLength(questions.length);
    expect(view.allQuestions.map((q) => q.id)).toEqual(["q1", "q2", "q3", "q4", "q5"]);
  });

  it("carries the question text and both participants' human-readable answers", () => {
    const view = buildWavelengthResultView(questions, answers);
    const q1 = view.allQuestions.find((q) => q.id === "q1")!;
    expect(q1.text).toBe("Ideal weekend?");
    expect(q1.answerA).toBe("Stay in");
    expect(q1.answerB).toBe("Stay in");
  });
});

describe("formatAnswer: human-readable text for every question type", () => {
  it("choice: the option text, not the raw index", () => {
    const q = { type: "choice" as const, options: ["Stay in", "Go out"] };
    expect(formatAnswer(q, 0)).toBe("Stay in");
    expect(formatAnswer(q, 1)).toBe("Go out");
  });

  it("scale: the fixed 0/25/50/75/100 label, not the raw number alone", () => {
    const q = { type: "scale" as const, options: null };
    expect(formatAnswer(q, 0)).toBe("Nada importante");
    expect(formatAnswer(q, 25)).toBe("Poco importante");
    expect(formatAnswer(q, 50)).toBe("Moderadamente importante");
    expect(formatAnswer(q, 75)).toBe("Muy importante");
    expect(formatAnswer(q, 100)).toBe("Extremadamente importante");
  });
});

describe("buildWavelengthResultView: determinism and error handling", () => {
  it("is deterministic — the same input always produces the same view", () => {
    const a = buildWavelengthResultView(questions, answers);
    const b = buildWavelengthResultView(questions, answers);
    expect(a).toEqual(b);
  });

  it("throws ResultDataError (not a raw scoring error) for incomplete/malformed data", () => {
    const incompleteAnswers = answers.filter((a) => a.question_id !== "q5");
    expect(() => buildWavelengthResultView(questions, incompleteAnswers)).toThrow(ResultDataError);
  });
});
