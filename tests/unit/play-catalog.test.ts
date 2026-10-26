import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { READY_MADE_GAMES } from "../../lib/wavelength/ready-made-games";

// What each ready-made game card on /play/dating-couples and /play/friends
// does when clicked. Every card is one link — its only action — to its
// experience's own page; no card starts a game directly (the experience
// pages' Start buttons do that), and there's no secondary "More" link.

vi.mock("@/app/actions/ready-made-games", () => ({ startReadyMadeGame: async () => {} }));
vi.mock("next/font/google", () => {
  const font = () => ({ variable: "font", className: "font", style: {} });
  return { Fraunces: font, Nunito_Sans: font };
});

async function renderCatalog(path: "dating-couples" | "friends") {
  const { default: Page } =
    path === "dating-couples"
      ? await import("../../app/play/dating-couples/page")
      : await import("../../app/play/friends/page");
  return renderToStaticMarkup(createElement(Page));
}

const EXPECTED_CARDS = {
  "dating-couples": [
    ["how-well-do-you-know-each-other", "/play/dating-couples/couples-compatibility-test"],
    ["getting-to-know-you", "/play/dating-couples/getting-to-know-each-other-questions"],
    ["date-night", "/play/dating-couples/date-night"],
    ["36-questions-to-fall-in-love", "/play/dating-couples/36-questions-to-fall-in-love"],
  ],
  friends: [
    ["how-well-do-you-know-me", "/play/friends/how-well-do-you-know-me"],
    ["friendship-check", "/play/friends/friendship-test"],
  ],
} as const;

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

for (const group of ["dating-couples", "friends"] as const) {
  describe(`/play/${group} catalog cards`, () => {
    it("lists the group's games in their existing order", async () => {
      const html = await renderCatalog(group);
      const positions = READY_MADE_GAMES.filter((g) => g.group === group).map((g) =>
        html.indexOf(`>${g.title.replace(/&/g, "&amp;")}`),
      );
      expect(positions.every((index) => index > -1)).toBe(true);
      expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    });

    it("makes every card a single link to its experience page", async () => {
      const html = await renderCatalog(group);
      for (const [id, href] of EXPECTED_CARDS[group]) {
        expect(READY_MADE_GAMES.find((g) => g.id === id)?.href, id).toBe(href);
        expect(html, id).toMatch(
          new RegExp(`<a class="landing-card game-card[^"]*" href="${escapeRegExp(href)}">`),
        );
        expect(html.match(new RegExp(`href="${escapeRegExp(href)}"`, "g")), id).toHaveLength(1);
      }
    });

    it("never starts a game from the catalog, and has no secondary links", async () => {
      const html = await renderCatalog(group);
      expect(html).not.toContain('name="gameId"');
      expect(html).not.toContain("game-card__more");
      expect(html).not.toMatch(/>More</);
    });
  });
}

describe("catalog positioning", () => {
  it("/play/dating-couples is “Couples Games & Questions”", async () => {
    const { metadata } = await import("../../app/play/dating-couples/page");
    expect(metadata.title).toBe("Couples Games & Questions — Sameeeish");
    expect(metadata.alternates?.canonical).toBe("/play/dating-couples");
    const html = await renderCatalog("dating-couples");
    expect(html).toMatch(/<h1[^>]*>Couples Games &amp; Questions<\/h1>/);
    expect(String(metadata.title)).not.toMatch(/compatibility/i);
  });

  it("/play/friends is “Friendship Quizzes & Games”", async () => {
    const { metadata } = await import("../../app/play/friends/page");
    expect(metadata.title).toBe("Friendship Quizzes & Games — Sameeeish");
    expect(metadata.alternates?.canonical).toBe("/play/friends");
    const html = await renderCatalog("friends");
    expect(html).toMatch(/<h1[^>]*>Friendship Quizzes &amp; Games<\/h1>/);
  });

  it("/for-couples keeps “Questions for Couples”", async () => {
    const { metadata } = await import("../../app/for-couples/page");
    expect(metadata.title).toBe("Questions for Couples — Sameeeish");
  });

  it("/for-friends links each friends game to its experience page", async () => {
    const { default: Page } = await import("../../app/for-friends/page");
    const html = renderToStaticMarkup(createElement(Page));
    for (const [, href] of EXPECTED_CARDS.friends) {
      expect(html).toContain(`href="${href}"`);
    }
  });
});
