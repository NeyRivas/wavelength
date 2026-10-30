import { describe, expect, it } from "vitest";

import { UNWRITTEN_OPTION } from "../../lib/wavelength/categories";
import {
  firstUnansweredIndex,
  isPresetQuizGame,
  needsWrittenOptions,
  prepareWrittenOptions,
  presetWritesOwnOptions,
  realOptions,
  sameOptions,
  WRITTEN_OPTIONS_ERRORS,
} from "../../lib/wavelength/preset-quiz";
import { getReadyMadeGame, READY_MADE_GAMES } from "../../lib/wavelength/ready-made-games";

// The guided quiz's own decisions (lib/wavelength/preset-quiz.ts): which
// ready-made games play in it, where a participant resumes, and how A's
// written answer options are cleaned up before being saved.

describe("which games use the guided quiz", () => {
  it("is every ready-made game with a fixed, scored question set", () => {
    const guided = READY_MADE_GAMES.filter(isPresetQuizGame).map((game) => game.id);
    expect(guided).toEqual([
      "how-well-do-you-know-each-other",
      "getting-to-know-you",
      "how-well-do-you-know-me",
      "friendship-check",
    ]);
  });

  it("leaves out conversation experiences, games with no questions, and Make Your Own", () => {
    expect(isPresetQuizGame(getReadyMadeGame("36-questions-to-fall-in-love"))).toBe(false);
    expect(isPresetQuizGame(getReadyMadeGame("date-night"))).toBe(false);
    expect(isPresetQuizGame(undefined)).toBe(false);
  });

  it("asks A to write their own options only in the friends games", () => {
    const writers = READY_MADE_GAMES.filter(isPresetQuizGame)
      .filter(presetWritesOwnOptions)
      .map((game) => game.id);
    expect(writers).toEqual(["how-well-do-you-know-me", "friendship-check"]);
  });
});

describe("needsWrittenOptions", () => {
  const choice = (options: string[] | null) => ({
    id: "q",
    type: "choice" as const,
    text: "Question?",
    options,
  });

  it("is true for every choice question when A writes their own options", () => {
    expect(needsWrittenOptions(choice(["Yes", "No"]), true)).toBe(true);
  });

  it("is false for a choice question that already has its options", () => {
    expect(needsWrittenOptions(choice(["Yes", "No"]), false)).toBe(false);
  });

  it("falls back to writing when a choice question doesn't have enough real options", () => {
    expect(needsWrittenOptions(choice([UNWRITTEN_OPTION, UNWRITTEN_OPTION]), false)).toBe(true);
    expect(needsWrittenOptions(choice(["Only one"]), false)).toBe(true);
  });

  it("is never true for a scale question", () => {
    expect(
      needsWrittenOptions({ id: "q", type: "scale", text: "How much?", options: null }, true),
    ).toBe(false);
  });
});

describe("realOptions", () => {
  it("drops unwritten placeholders and blanks", () => {
    expect(realOptions([UNWRITTEN_OPTION, "Paris", "  ", "Rome"])).toEqual(["Paris", "Rome"]);
    expect(realOptions(null)).toEqual([]);
  });
});

describe("firstUnansweredIndex", () => {
  const questions = [{ id: "a" }, { id: "b" }, { id: "c" }];

  it("resumes at the first question without a saved answer", () => {
    expect(firstUnansweredIndex(questions, { a: 0 })).toBe(1);
    expect(firstUnansweredIndex(questions, { a: 0, c: 2 })).toBe(1);
  });

  it("treats 0 as a real answer (first option / 'Not important')", () => {
    expect(firstUnansweredIndex(questions, { a: 0, b: 0 })).toBe(2);
  });

  it("is -1 once everything is answered", () => {
    expect(firstUnansweredIndex(questions, { a: 0, b: 1, c: 2 })).toBe(-1);
  });
});

describe("prepareWrittenOptions", () => {
  it("returns the trimmed options and the index of the one marked real", () => {
    expect(prepareWrittenOptions([" Paris ", "Rome"], 1)).toEqual({
      ok: true,
      options: ["Paris", "Rome"],
      answerIndex: 1,
    });
  });

  it("drops empty fields, counting the real answer among the remaining ones", () => {
    expect(prepareWrittenOptions(["Paris", "", "Rome"], 2)).toEqual({
      ok: true,
      options: ["Paris", "Rome"],
      answerIndex: 1,
    });
  });

  it("needs at least two answers", () => {
    expect(prepareWrittenOptions(["Paris", "  "], 0)).toEqual({
      ok: false,
      error: WRITTEN_OPTIONS_ERRORS.tooFew,
    });
  });

  it("allows at most five answers", () => {
    expect(prepareWrittenOptions(["a", "b", "c", "d", "e", "f"], 0)).toEqual({
      ok: false,
      error: WRITTEN_OPTIONS_ERRORS.tooMany,
    });
  });

  it("rejects answers that only differ by case or spacing, like the server does", () => {
    expect(prepareWrittenOptions(["Paris", " paris"], 0)).toEqual({
      ok: false,
      error: WRITTEN_OPTIONS_ERRORS.duplicate,
    });
  });

  it("needs one answer marked as real, and not an empty one", () => {
    expect(prepareWrittenOptions(["Paris", "Rome"], null)).toEqual({
      ok: false,
      error: WRITTEN_OPTIONS_ERRORS.noCorrect,
    });
    expect(prepareWrittenOptions(["Paris", "Rome", ""], 2)).toEqual({
      ok: false,
      error: WRITTEN_OPTIONS_ERRORS.noCorrect,
    });
  });
});

describe("sameOptions", () => {
  it("compares options in order", () => {
    expect(sameOptions(["a", "b"], ["a", "b"])).toBe(true);
    expect(sameOptions(["a", "b"], ["b", "a"])).toBe(false);
    expect(sameOptions(["a"], ["a", "b"])).toBe(false);
  });
});
