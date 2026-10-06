import { describe, expect, it } from "vitest";

import { getExperienceCopy } from "../../lib/wavelength/experience-copy";
import { READY_MADE_GAMES } from "../../lib/wavelength/ready-made-games";

const PLAYABLE_GAME_IDS = READY_MADE_GAMES.filter((g) => g.questions).map((g) => g.id);

describe("getExperienceCopy", () => {
  it("returns a distinct copy set for each playable ready-made game", () => {
    const seen = new Set<string>();
    for (const id of PLAYABLE_GAME_IDS) {
      const copy = getExperienceCopy(id);
      seen.add(JSON.stringify(copy));
    }
    expect(seen.size).toBe(PLAYABLE_GAME_IDS.length);
  });

  it("falls back to the Make Your Own default for an unknown/undefined id", () => {
    expect(getExperienceCopy(undefined)).toEqual(getExperienceCopy("not-a-real-game"));
  });

  it("every field, for every known game plus the default, mentions no 'wavelength' branding", () => {
    for (const id of [...PLAYABLE_GAME_IDS, undefined]) {
      const copy = getExperienceCopy(id);
      for (const value of Object.values(copy)) {
        expect(value.toLowerCase()).not.toContain("wavelength");
      }
    }
  });

  it("'How Well Do You Know Me?' frames the answer step around guessing a person, not a shared memory", () => {
    const copy = getExperienceCopy("how-well-do-you-know-me");
    expect(copy.answerText.toLowerCase()).toMatch(/they picked|know them/);
  });

  it("'Friendship Check' frames the answer step around the shared friendship, not just one person", () => {
    const copy = getExperienceCopy("friendship-check");
    expect(copy.answerText.toLowerCase()).toMatch(/friend|remember|memories|share/);
  });
});
