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
        const text = typeof value === "function" ? value("Alex") : value;
        expect(text.toLowerCase()).not.toContain("wavelength");
      }
    }
  });

  it("'How Well Do You Know Me?' frames the answer step around guessing a person, not a shared memory", () => {
    const copy = getExperienceCopy("how-well-do-you-know-me");
    expect(copy.answerText("Alex").toLowerCase()).toMatch(/alex.*actually chose|know them/);
  });

  it("'Friendship Check' frames the answer step around the shared friendship, not just one person", () => {
    const copy = getExperienceCopy("friendship-check");
    expect(copy.answerText("Alex").toLowerCase()).toMatch(/friend|remember|memories|share/);
  });

  it("'How Well Do You Know Me?'s answer copy makes clear B is guessing A's answer, not giving their own", () => {
    const copy = getExperienceCopy("how-well-do-you-know-me");
    const text = copy.answerText("Alex").toLowerCase();
    expect(text).toContain("alex");
    expect(text).toMatch(/not your own answer/);
  });

  it("'Friendship Check' never reuses 'Think you know them?' (that phrase is How Well Do You Know Me?'s own)", () => {
    const copy = getExperienceCopy("friendship-check");
    expect(copy.answerHeading.toLowerCase()).not.toBe("think you know them?");
    expect(copy.answerText("Alex").toLowerCase()).not.toContain("think you know them");
  });

  it("every game's inviteText and answerText weave in the given alias", () => {
    for (const id of PLAYABLE_GAME_IDS) {
      const copy = getExperienceCopy(id);
      expect(copy.inviteText("Riley")).toContain("Riley");
      expect(copy.answerText("Riley")).toContain("Riley");
    }
  });

  it("every known game has its own, non-generic invite heading/text (B's pre-claim screen)", () => {
    const makeYourOwn = getExperienceCopy(undefined);
    for (const id of PLAYABLE_GAME_IDS) {
      const copy = getExperienceCopy(id);
      expect(copy.inviteHeading).not.toBe(makeYourOwn.inviteHeading);
      expect(copy.inviteText("Alex")).not.toBe(makeYourOwn.inviteText("Alex"));
    }
  });
});
