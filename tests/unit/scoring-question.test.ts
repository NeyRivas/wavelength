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

const situationQ: ScoringQuestion = {
  id: "q-situation",
  category: "money",
  orderIndex: 1,
  type: "situation",
  optionCount: 2,
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

describe("scoreQuestion: situation", () => {
  it("scores 100 when both picked the same option", () => {
    expect(scoreQuestion(situationQ, 1, 1)).toBe(100);
  });

  it("scores 0 when they picked different options", () => {
    expect(scoreQuestion(situationQ, 0, 1)).toBe(0);
  });
});

describe("scoreQuestion: scale — every difference 0 through 4", () => {
  it.each([
    [1, 1, 0, 100],
    [3, 3, 0, 100],
    [5, 5, 0, 100],
    [1, 2, 1, 75],
    [4, 3, 1, 75],
    [1, 3, 2, 50],
    [5, 3, 2, 50],
    [1, 4, 3, 25],
    [5, 2, 3, 25],
    [1, 5, 4, 0],
    [5, 1, 4, 0],
  ])("|%i - %i| = %i -> %i", (a, b, _diff, expected) => {
    expect(scoreQuestion(scaleQ, a, b)).toBe(expected);
  });

  it("is symmetric (order of A/B doesn't matter)", () => {
    expect(scoreQuestion(scaleQ, 2, 5)).toBe(scoreQuestion(scaleQ, 5, 2));
  });
});

describe("validateAnswerValue: choice/situation", () => {
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
  it("accepts every value 1 through 5", () => {
    for (const v of [1, 2, 3, 4, 5]) {
      expect(() => validateAnswerValue(scaleQ, v)).not.toThrow();
    }
  });

  it("rejects 0 and 6 (just outside the 1-5 range)", () => {
    expect(() => validateAnswerValue(scaleQ, 0)).toThrow(InvalidAnswerValueError);
    expect(() => validateAnswerValue(scaleQ, 6)).toThrow(InvalidAnswerValueError);
  });

  it("rejects a non-integer value", () => {
    expect(() => validateAnswerValue(scaleQ, 2.5)).toThrow(InvalidAnswerValueError);
  });

  it("rejects NaN", () => {
    expect(() => validateAnswerValue(scaleQ, Number.NaN)).toThrow(InvalidAnswerValueError);
  });
});
