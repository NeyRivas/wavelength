import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  countIdeas,
  FRIENDSHIP_TRIVIA_IDEAS,
  GETTING_TO_KNOW_YOU_IDEAS,
  HOW_WELL_DO_YOU_KNOW_ME_IDEAS,
  type QuestionIdeaGroup,
} from "../../lib/wavelength/question-ideas";
import { getReadyMadeGame } from "../../lib/wavelength/ready-made-games";

// The extra question lists on three experience pages: the approved counts,
// no overlap with the game played on the same page, every idea rendered
// once in its own section, and metadata that claims the real count.

vi.mock("@/app/actions/ready-made-games", () => ({ startReadyMadeGame: async () => {} }));
vi.mock("next/font/google", () => {
  const font = () => ({ variable: "font", className: "font", style: {} });
  return { Fraunces: font, Nunito_Sans: font };
});

const escaped = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/'/g, "&#x27;").replace(/"/g, "&quot;");

// Compare questions loosely, so a curly apostrophe or a case change can't
// sneak a game question back in as an "extra".
const normalize = (text: string) =>
  text.toLowerCase().replace(/[’‘]/g, "'").replace(/[“”"]/g, "").replace(/\s+/g, " ").trim();

const PAGES: {
  name: string;
  ideas: QuestionIdeaGroup[];
  count: number;
  gameId: string;
  heading: string;
  load: () => Promise<{
    default: () => unknown;
    metadata: { description?: unknown };
  }>;
}[] = [
  {
    name: "How Well Do You Know Me?",
    ideas: HOW_WELL_DO_YOU_KNOW_ME_IDEAS,
    count: 40,
    gameId: "how-well-do-you-know-me",
    heading: "40 more how well do you know me questions",
    load: () => import("../../app/play/friends/how-well-do-you-know-me/page"),
  },
  {
    name: "Friendship Test",
    ideas: FRIENDSHIP_TRIVIA_IDEAS,
    count: 30,
    gameId: "friendship-check",
    heading: "Friendship trivia questions to ask in person",
    load: () => import("../../app/play/friends/friendship-test/page"),
  },
  {
    name: "Getting to know each other",
    ideas: GETTING_TO_KNOW_YOU_IDEAS,
    count: 50,
    gameId: "getting-to-know-you",
    heading: "50 more questions to ask when getting to know someone",
    load: () => import("../../app/play/dating-couples/getting-to-know-each-other-questions/page"),
  },
];

for (const page of PAGES) {
  describe(`${page.name}: extra question ideas`, () => {
    const all = page.ideas.flatMap((group) => group.questions);

    it(`has the approved ${page.count} questions, grouped, each a question`, () => {
      expect(countIdeas(page.ideas)).toBe(page.count);
      expect(all).toHaveLength(page.count);
      for (const group of page.ideas) {
        expect(group.title.trim(), group.title).not.toBe("");
        expect(group.questions.length, group.title).toBeGreaterThan(0);
      }
      for (const question of all) {
        expect(question, question).toMatch(/\?$/);
      }
    });

    it("repeats no question, within the list or from the game on the same page", () => {
      const game = getReadyMadeGame(page.gameId)!;
      const seen = new Set(game.questions!.map((q) => normalize(q.text)));
      expect(seen.size).toBe(12);
      for (const question of all) {
        expect(seen.has(normalize(question)), question).toBe(false);
        seen.add(normalize(question));
      }
    });

    it("renders every idea once, numbered straight through, under its own heading", async () => {
      const { default: Page } = await page.load();
      const html = renderToStaticMarkup(createElement(Page as never));
      expect(html).toContain(`>${escaped(page.heading)}</h2>`);
      for (const group of page.ideas) {
        expect(html, group.title).toContain(`>${escaped(group.title)}</h3>`);
      }
      for (const question of all) {
        expect(html.split(`<li>${escaped(question)}</li>`), question).toHaveLength(2);
      }
      // Each group's list continues the numbering of the one before it.
      const starts = [...html.matchAll(/<ol class="xp-ideas__list" start="(\d+)">/g)].map((m) =>
        Number(m[1]),
      );
      let expected = 1;
      expect(starts).toHaveLength(page.ideas.length);
      page.ideas.forEach((group, index) => {
        expect(starts[index]).toBe(expected);
        expected += group.questions.length;
      });
      // The section says the game doesn't use these, so nobody expects them in it.
      expect(html).toMatch(/aren&#x27;t in the (quiz|test|game)/);
    });

    it("claims the real number of extra ideas in the description, if it claims one", async () => {
      const description = String((await page.load()).metadata.description);
      const claimed = description.match(/plus (\d+) more/);
      if (claimed) expect(Number(claimed[1])).toBe(page.count);
    });
  });
}
