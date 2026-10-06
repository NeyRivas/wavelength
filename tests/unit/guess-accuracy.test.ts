import { describe, expect, it } from "vitest";

import {
  computeGuessAccuracy,
  GUESS_ACCURACY_MESSAGES,
  guessAccuracyMessageForA,
  type GuessAccuracyTier,
} from "../../lib/wavelength/guess-accuracy";

function scoresFor(correctCount: number, total: number): number[] {
  return Array.from({ length: total }, (_, i) => (i < correctCount ? 100 : 0));
}

describe("computeGuessAccuracy", () => {
  it("counts a 'choice' match (score 100) as correct, a non-match (score 0) as incorrect", () => {
    const result = computeGuessAccuracy([100, 0, 100, 100, 0]);
    expect(result.correctCount).toBe(3);
    expect(result.totalQuestions).toBe(5);
  });

  it("maps 10-12 correct (out of 12) to the 'excellent' tier", () => {
    expect(computeGuessAccuracy(scoresFor(10, 12)).tier).toBe("excellent");
    expect(computeGuessAccuracy(scoresFor(12, 12)).tier).toBe("excellent");
  });

  it("maps 7-9 correct to the 'good' tier", () => {
    expect(computeGuessAccuracy(scoresFor(7, 12)).tier).toBe("good");
    expect(computeGuessAccuracy(scoresFor(9, 12)).tier).toBe("good");
  });

  it("maps 4-6 correct to the 'fair' tier", () => {
    expect(computeGuessAccuracy(scoresFor(4, 12)).tier).toBe("fair");
    expect(computeGuessAccuracy(scoresFor(6, 12)).tier).toBe("fair");
  });

  it("maps 0-3 correct to the 'poor' tier", () => {
    expect(computeGuessAccuracy(scoresFor(0, 12)).tier).toBe("poor");
    expect(computeGuessAccuracy(scoresFor(3, 12)).tier).toBe("poor");
  });

  it("the boundary between tiers falls exactly where specified (6 vs 7, 9 vs 10)", () => {
    expect(computeGuessAccuracy(scoresFor(6, 12)).tier).toBe("fair");
    expect(computeGuessAccuracy(scoresFor(7, 12)).tier).toBe("good");
    expect(computeGuessAccuracy(scoresFor(9, 12)).tier).toBe("good");
    expect(computeGuessAccuracy(scoresFor(10, 12)).tier).toBe("excellent");
  });

  it("returns the exact approved message text for each tier", () => {
    expect(computeGuessAccuracy(scoresFor(12, 12)).message).toBe("You basically live in my head.");
    expect(computeGuessAccuracy(scoresFor(8, 12)).message).toBe("Okay, you know me pretty well.");
    expect(computeGuessAccuracy(scoresFor(5, 12)).message).toBe("We might need to hang out more.");
    expect(computeGuessAccuracy(scoresFor(1, 12)).message).toBe("Do you even know me? \u{1F602}");
  });

  it("GUESS_ACCURACY_MESSAGES has no High/Mixed/Low or percentage-style wording", () => {
    for (const message of Object.values(GUESS_ACCURACY_MESSAGES)) {
      expect(message.toLowerCase()).not.toMatch(/alignment|compatib|wavelength|same page|%/);
    }
  });
});

describe("guessAccuracyMessageForA (A's own perspective on B's result)", () => {
  const tiers: GuessAccuracyTier[] = ["excellent", "good", "fair", "poor"];

  it("returns a distinct, perspective-matched sentence per tier, naming B by alias", () => {
    expect(guessAccuracyMessageForA("excellent", "Bailey")).toBe(
      "Bailey basically lives in your head.",
    );
    expect(guessAccuracyMessageForA("good", "Bailey")).toBe("Okay, Bailey knows you pretty well.");
    expect(guessAccuracyMessageForA("fair", "Bailey")).toBe(
      "Bailey might need to hang out with you more.",
    );
    expect(guessAccuracyMessageForA("poor", "Bailey")).toBe("Does Bailey even know you? \u{1F602}");
  });

  it("is never identical to B's own message for the same tier (not a mechanical you/me swap gone unchanged)", () => {
    for (const tier of tiers) {
      expect(guessAccuracyMessageForA(tier, "Bailey")).not.toBe(GUESS_ACCURACY_MESSAGES[tier]);
    }
  });

  it("always names the given alias", () => {
    for (const tier of tiers) {
      expect(guessAccuracyMessageForA(tier, "Riley")).toContain("Riley");
    }
  });

  it("has no High/Mixed/Low, wavelength, or percentage-style wording for any tier", () => {
    for (const tier of tiers) {
      expect(guessAccuracyMessageForA(tier, "Bailey").toLowerCase()).not.toMatch(
        /alignment|compatib|wavelength|same page|%/,
      );
    }
  });
});
