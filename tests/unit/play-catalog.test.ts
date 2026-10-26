import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { READY_MADE_GAMES } from "../../lib/wavelength/ready-made-games";

// What each ready-made game card on /play/dating-couples and /play/friends
// does when clicked: start the game directly (a form submitting
// startReadyMadeGame with the game's id) or open the experience's own page
// (a link). Locks every card's behavior so a change to one card can't
// silently change another.

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

const startsGame = (html: string, id: string) =>
  (html.match(new RegExp(`name="gameId" value="${id}"`, "g")) ?? []).length;

describe("Dating & Couples catalog cards", () => {
  it("shows the four couples games in their existing order", async () => {
    const html = await renderCatalog("dating-couples");
    const titles = READY_MADE_GAMES.filter((g) => g.group === "dating-couples").map((g) =>
      html.indexOf(`>${g.title.replace(/&/g, "&amp;")}`),
    );
    expect(titles.every((index) => index > -1)).toBe(true);
    expect([...titles].sort((a, b) => a - b)).toEqual(titles);
  });

  it("“Are we on the same page?” starts the game directly", async () => {
    const html = await renderCatalog("dating-couples");
    expect(startsGame(html, "how-well-do-you-know-each-other")).toBe(1);
  });

  it("“Getting to know each other” opens its experience page through a single card link", async () => {
    const html = await renderCatalog("dating-couples");
    expect(startsGame(html, "getting-to-know-you")).toBe(0);
    expect(html).toMatch(
      /<a class="landing-card game-card[^"]*" href="\/play\/dating-couples\/getting-to-know-each-other-questions">/,
    );
    expect(
      html.match(/href="\/play\/dating-couples\/getting-to-know-each-other-questions"/g),
    ).toHaveLength(1);
    expect(html).not.toContain("game-card__more");
    expect(html).not.toMatch(/>More</);
  });

  it("“Date Night” opens its own page", async () => {
    const html = await renderCatalog("dating-couples");
    expect(startsGame(html, "date-night")).toBe(0);
    expect(html).toMatch(
      /<a class="landing-card game-card[^"]*" href="\/play\/dating-couples\/date-night">/,
    );
  });

  it("“36 Questions to Fall in Love” opens its own page", async () => {
    const html = await renderCatalog("dating-couples");
    expect(startsGame(html, "36-questions-to-fall-in-love")).toBe(0);
    expect(html).toMatch(
      /<a class="landing-card game-card[^"]*" href="\/play\/dating-couples\/36-questions-to-fall-in-love">/,
    );
  });
});

describe("Friends catalog cards", () => {
  it("both friends games start directly and nothing else on the page starts a game", async () => {
    const html = await renderCatalog("friends");
    expect(startsGame(html, "how-well-do-you-know-me")).toBe(1);
    expect(startsGame(html, "friendship-check")).toBe(1);
    expect((html.match(/name="gameId"/g) ?? []).length).toBe(2);
    expect(html).not.toContain("game-card__more");
  });
});
