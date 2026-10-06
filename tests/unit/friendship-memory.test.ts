import { describe, expect, it } from "vitest";

import {
  computeFriendshipMemory,
  FRIENDSHIP_MEMORY_MESSAGES,
} from "../../lib/wavelength/friendship-memory";

function scoresFor(correctCount: number, total: number): number[] {
  return Array.from({ length: total }, (_, i) => (i < correctCount ? 100 : 0));
}

describe("computeFriendshipMemory", () => {
  it("counts a 'choice' match (score 100) as correct, a non-match (score 0) as incorrect", () => {
    const result = computeFriendshipMemory([100, 0, 100, 100, 0]);
    expect(result.correctCount).toBe(3);
    expect(result.totalQuestions).toBe(5);
  });

  it("maps 10-12 correct (out of 12) to the 'excellent' tier", () => {
    expect(computeFriendshipMemory(scoresFor(10, 12)).tier).toBe("excellent");
    expect(computeFriendshipMemory(scoresFor(12, 12)).tier).toBe("excellent");
  });

  it("maps 7-9 correct to the 'good' tier", () => {
    expect(computeFriendshipMemory(scoresFor(7, 12)).tier).toBe("good");
    expect(computeFriendshipMemory(scoresFor(9, 12)).tier).toBe("good");
  });

  it("maps 4-6 correct to the 'fair' tier", () => {
    expect(computeFriendshipMemory(scoresFor(4, 12)).tier).toBe("fair");
    expect(computeFriendshipMemory(scoresFor(6, 12)).tier).toBe("fair");
  });

  it("maps 0-3 correct to the 'poor' tier", () => {
    expect(computeFriendshipMemory(scoresFor(0, 12)).tier).toBe("poor");
    expect(computeFriendshipMemory(scoresFor(3, 12)).tier).toBe("poor");
  });

  it("the boundary between tiers falls exactly where specified (6 vs 7, 9 vs 10)", () => {
    expect(computeFriendshipMemory(scoresFor(6, 12)).tier).toBe("fair");
    expect(computeFriendshipMemory(scoresFor(7, 12)).tier).toBe("good");
    expect(computeFriendshipMemory(scoresFor(9, 12)).tier).toBe("good");
    expect(computeFriendshipMemory(scoresFor(10, 12)).tier).toBe("excellent");
  });

  it("returns the exact approved message text for each tier", () => {
    expect(computeFriendshipMemory(scoresFor(12, 12)).message).toBe(
      "You basically know our friendship by heart.",
    );
    expect(computeFriendshipMemory(scoresFor(8, 12)).message).toBe(
      "Okay, you know our friendship pretty well.",
    );
    expect(computeFriendshipMemory(scoresFor(5, 12)).message).toBe(
      "We might need to make more memories.",
    );
    expect(computeFriendshipMemory(scoresFor(1, 12)).message).toBe(
      "Were you even there? \u{1F602}",
    );
  });

  it("FRIENDSHIP_MEMORY_MESSAGES has no High/Mixed/Low, alignment, wavelength, or percentage-style wording", () => {
    for (const message of Object.values(FRIENDSHIP_MEMORY_MESSAGES)) {
      expect(message.toLowerCase()).not.toMatch(/alignment|compatib|wavelength|same page|%/);
    }
  });

  it("FRIENDSHIP_MEMORY_MESSAGES text is distinct from guess-accuracy's own message set", () => {
    // These are two separate, isolated result modes (resultMode:
    // "friendship-memory" vs. "guess-accuracy") with their own approved
    // copy — this just confirms this game's messages were never
    // accidentally copied from "How Well Do You Know Me?"'s.
    expect(Object.values(FRIENDSHIP_MEMORY_MESSAGES)).not.toContain(
      "You basically live in my head.",
    );
    expect(Object.values(FRIENDSHIP_MEMORY_MESSAGES)).not.toContain(
      "Okay, you know me pretty well.",
    );
  });
});
