import { describe, expect, it } from "vitest";

import {
  InvalidAnswerValueError,
  scoreQuestion,
  validateAnswerValue,
  type ScoringQuestion,
} from "../../lib/scoring/score";

const choiceQ: ScoringQuestion = {
  id: "q-choice",
  category: "relationship",
  orderIndex: 0,
  type: "choice",
  optionCount: 3,
};

const scaleQ: ScoringQuestion = {
  id: "q-scale",
  category: "future",
  orderIndex: 2,
  type: "scale",
};

describe("scoreQuestion: choice", () => {
  it("scores 100 when both picked the same option", () => {
    expect(scoreQuestion(choiceQ, 0, 0)).toBe(100);
    expect(scoreQuestion(choiceQ, 2, 2)).toBe(100);
  });

  it("scores 0 when they picked different options", () => {
    expect(scoreQuestion(choiceQ, 0, 1)).toBe(0);
    expect(scoreQuestion(choiceQ, 2, 0)).toBe(0);
  });
});

describe("scoreQuestion: scale — every level of the fixed 0/25/50/75/100 domain", () => {
  it.each([
    [0, 0, 100],
    [50, 50, 100],
    [100, 100, 100],
    [0, 25, 75],
    [75, 50, 75],
    [0, 50, 50],
    [100, 50, 50],
    [0, 75, 25],
    [100, 25, 25],
    [0, 100, 0],
    [100, 0, 0],
  ])("scoreQuestion(scale, %i, %i) -> %i", (a, b, expected) => {
    expect(scoreQuestion(scaleQ, a, b)).toBe(expected);
  });

  it("is symmetric (order of A/B doesn't matter)", () => {
    expect(scoreQuestion(scaleQ, 25, 100)).toBe(scoreQuestion(scaleQ, 100, 25));
  });

  it("matches the approved table exactly: same/1/2/3/4 levels apart -> 100/75/50/25/0", () => {
    expect(scoreQuestion(scaleQ, 50, 50)).toBe(100); // same
    expect(scoreQuestion(scaleQ, 50, 75)).toBe(75); // 1 level
    expect(scoreQuestion(scaleQ, 25, 75)).toBe(50); // 2 levels
    expect(scoreQuestion(scaleQ, 25, 100)).toBe(25); // 3 levels
    expect(scoreQuestion(scaleQ, 0, 100)).toBe(0); // 4 levels
  });
});

describe("validateAnswerValue: choice", () => {
  it("accepts every valid option index", () => {
    expect(() => validateAnswerValue(choiceQ, 0)).not.toThrow();
    expect(() => validateAnswerValue(choiceQ, 1)).not.toThrow();
    expect(() => validateAnswerValue(choiceQ, 2)).not.toThrow(); // optionCount - 1
  });

  it("rejects a negative index", () => {
    expect(() => validateAnswerValue(choiceQ, -1)).toThrow(InvalidAnswerValueError);
  });

  it("rejects an index >= optionCount", () => {
    expect(() => validateAnswerValue(choiceQ, 3)).toThrow(InvalidAnswerValueError);
  });

  it("rejects a non-integer value", () => {
    expect(() => validateAnswerValue(choiceQ, 1.5)).toThrow(InvalidAnswerValueError);
  });
});

describe("validateAnswerValue: scale", () => {
  it("accepts every value in the fixed domain", () => {
    for (const v of [0, 25, 50, 75, 100]) {
      expect(() => validateAnswerValue(scaleQ, v)).not.toThrow();
    }
  });

  it("rejects the old 1-5 index domain — no longer valid", () => {
    for (const v of [1, 2, 3, 4, 5]) {
      expect(() => validateAnswerValue(scaleQ, v)).toThrow(InvalidAnswerValueError);
    }
  });

  it("rejects values outside the fixed domain, including in-between numbers", () => {
    expect(() => validateAnswerValue(scaleQ, -1)).toThrow(InvalidAnswerValueError);
    expect(() => validateAnswerValue(scaleQ, 10)).toThrow(InvalidAnswerValueError);
    expect(() => validateAnswerValue(scaleQ, 101)).toThrow(InvalidAnswerValueError);
  });

  it("rejects a non-integer value", () => {
    expect(() => validateAnswerValue(scaleQ, 62.5)).toThrow(InvalidAnswerValueError);
  });

  it("rejects NaN", () => {
    expect(() => validateAnswerValue(scaleQ, Number.NaN)).toThrow(InvalidAnswerValueError);
  });
});
