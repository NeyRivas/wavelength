import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { DATE_NIGHT_QUESTIONS, MOOD_LABELS, MOODS } from "../../lib/date-night/questions";
import { isPublicPath } from "../../lib/analytics/ga-privacy-guard";
import { alignmentLevel } from "../../lib/scoring/score";
import { CATEGORY_LABELS, SCALE_LABELS } from "../../lib/wavelength/categories";
import { FRIENDSHIP_MEMORY_MESSAGES } from "../../lib/wavelength/friendship-memory";
import { GUESS_ACCURACY_MESSAGES } from "../../lib/wavelength/guess-accuracy";
import { getReadyMadeGame } from "../../lib/wavelength/ready-made-games";
import { ALIGNMENT_INTERPRETATION } from "../../lib/wavelength/result";

// The integrated experience pages for How Well Do You Know Me?, Friendship
// Check, and the Couples Compatibility Test, plus Date Night's editorial
// section: metadata, structure, the real questions rendered from each
// game's own data, Start buttons, internal links, sitemap, and analytics.

vi.mock("@/app/actions/ready-made-games", () => ({ startReadyMadeGame: async () => {} }));
vi.mock("next/font/google", () => {
  const font = () => ({ variable: "font", className: "font", style: {} });
  return { Fraunces: font, Nunito_Sans: font };
});

const APP_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../app");

// React escapes these in text and attributes.
const escaped = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/'/g, "&#x27;").replace(/"/g, "&quot;");
const textOf = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");

function internalHrefs(html: string): string[] {
  return [...html.matchAll(/href="(\/[^"#?]*)"/g)].map((match) => match[1]!);
}

function expectRoutesExist(hrefs: string[]) {
  for (const href of new Set(hrefs)) {
    const segments = href === "/" ? [] : href.slice(1).split("/");
    expect(readdirSync(path.join(APP_DIR, ...segments)), href).toContain("page.tsx");
  }
}

async function sitemapUrls() {
  const { default: sitemap } = await import("../../app/sitemap");
  return sitemap().map((entry) => entry.url);
}

const GAME_PAGES = [
  {
    name: "How Well Do You Know Me?",
    path: "/play/friends/how-well-do-you-know-me",
    load: () => import("../../app/play/friends/how-well-do-you-know-me/page"),
    gameId: "how-well-do-you-know-me",
    title: "How Well Do You Know Me? Quiz for Friends — Sameeeish",
    h1: "How Well Do You Know Me?",
    keyword: /how well do you know me quiz/i,
    backTo: "/play/friends",
    links: [
      "/play/friends/friendship-test",
      "/play/dating-couples/getting-to-know-each-other-questions",
    ],
    showsOptions: false,
  },
  {
    name: "Friendship Test",
    path: "/play/friends/friendship-test",
    load: () => import("../../app/play/friends/friendship-test/page"),
    gameId: "friendship-check",
    title: "Friendship Test: How Well Do You Remember Us? — Sameeeish",
    h1: "Friendship Test",
    keyword: /friendship test/i,
    backTo: "/play/friends",
    links: [
      "/play/friends/how-well-do-you-know-me",
      "/play/dating-couples/getting-to-know-each-other-questions",
    ],
    showsOptions: false,
  },
  {
    name: "Couples Compatibility Test",
    path: "/play/dating-couples/couples-compatibility-test",
    load: () => import("../../app/play/dating-couples/couples-compatibility-test/page"),
    gameId: "how-well-do-you-know-each-other",
    title: "Couples Compatibility Test: Answer Apart, Compare Together — Sameeeish",
    h1: "Couples Compatibility Test",
    keyword: /couples compatibility test/i,
    backTo: "/play/dating-couples",
    links: [
      "/play/dating-couples/getting-to-know-each-other-questions",
      "/play/dating-couples/36-questions-to-fall-in-love",
      "/play/dating-couples/date-night",
    ],
    showsOptions: true,
  },
] as const;

for (const page of GAME_PAGES) {
  describe(`${page.name} page`, () => {
    const game = getReadyMadeGame(page.gameId)!;
    const render = async () => {
      const { default: Page } = await page.load();
      return renderToStaticMarkup(createElement(Page));
    };

    it("has its title, a description with the primary keyword, and its own canonical", async () => {
      const { metadata } = await page.load();
      expect(metadata.title).toBe(page.title);
      expect(String(metadata.description)).toMatch(page.keyword);
      expect(String(metadata.description).length).toBeLessThanOrEqual(160);
      expect(metadata.alternates?.canonical).toBe(page.path);
      expect(metadata.openGraph?.url).toBe(page.path);
      expect(metadata.openGraph?.title).toBe(page.title);
      expect(metadata.twitter?.title).toBe(page.title);
      expect(metadata.robots).toBeUndefined(); // indexable
    });

    it("has one H1 and says the game's real question count", async () => {
      const html = await render();
      expect(html.match(/<h1[^>]*>/g)).toHaveLength(1);
      expect(html).toContain(`>${escaped(page.h1)}</h1>`);
      expect(game.questions).toHaveLength(12);
      expect(textOf(html)).toContain(`${game.questions!.length} questions`);
    });

    it("renders every question from the game's data, in order, with its category", async () => {
      const html = await render();
      let previous = -1;
      for (const question of game.questions!) {
        const at = html.indexOf(escaped(question.text));
        expect(at, question.text).toBeGreaterThan(previous);
        previous = at;
        expect(html).toContain(escaped(CATEGORY_LABELS[question.category]));
      }
    });

    it(
      page.showsOptions
        ? "shows every answer choice, and the scale labels for the scale question"
        : "shows no pre-written answers (each player writes their own)",
      async () => {
        const html = await render();
        if (page.showsOptions) {
          for (const question of game.questions!) {
            for (const option of question.options ?? []) {
              expect(html, option).toContain(escaped(option));
            }
          }
          expect(game.questions!.some((q) => q.type === "scale")).toBe(true);
          for (const label of Object.values(SCALE_LABELS)) {
            expect(html).toContain(label);
          }
        } else {
          expect(html).not.toContain("answer choices</summary>");
        }
      },
    );

    it("only offers Start buttons for this game", async () => {
      const html = await render();
      expect(html.match(/name="gameId" value="[^"]*"/g)).toEqual([
        `name="gameId" value="${page.gameId}"`,
        `name="gameId" value="${page.gameId}"`,
      ]);
    });

    it("is the game's catalog card destination, with its questions unchanged", () => {
      expect(game.href).toBe(page.path);
      expect(game.secondary).toBeUndefined();
    });

    it("links back to its catalog and to related experiences that exist", async () => {
      const hrefs = internalHrefs(await render());
      for (const href of [page.backTo, ...page.links]) {
        expect(hrefs, href).toContain(href);
      }
      expectRoutesExist(hrefs);
    });

    it("is in the sitemap and on the analytics allowlist", async () => {
      expect(await sitemapUrls()).toContain(`https://sameeeish.com${page.path}`);
      expect(isPublicPath(page.path)).toBe(true);
    });

    it("makes no unverified claims", async () => {
      const text = textOf(await render());
      expect(text).not.toMatch(/guarantee|scientifically proven|#1|most popular|in minutes/i);
    });
  });
}

describe("result wording matches the games' real results", () => {
  it("How Well Do You Know Me? lists the result screen's own tiers", async () => {
    const { default: Page } = await import("../../app/play/friends/how-well-do-you-know-me/page");
    const html = renderToStaticMarkup(createElement(Page));
    for (const message of Object.values(GUESS_ACCURACY_MESSAGES)) {
      expect(html).toContain(escaped(message));
    }
    expect(textOf(html)).not.toMatch(/percentage|% aligned/i);
  });

  it("Friendship Test lists the result screen's own tiers", async () => {
    const { default: Page } = await import("../../app/play/friends/friendship-test/page");
    const html = renderToStaticMarkup(createElement(Page));
    for (const message of Object.values(FRIENDSHIP_MEMORY_MESSAGES)) {
      expect(html).toContain(escaped(message));
    }
    expect(textOf(html)).not.toMatch(/percentage|% aligned/i);
  });

  it("the compatibility test's alignment ranges match the scoring code", async () => {
    const { ALIGNMENT_RANGES } = await import("../../components/play/compatibility-test-content");
    for (const { level, range } of ALIGNMENT_RANGES) {
      const [low, high] = range.replace("%", "").split("–").map(Number);
      expect(alignmentLevel(low!), range).toBe(level);
      expect(alignmentLevel(high!), range).toBe(level);
    }
    expect(alignmentLevel(74)).toBe("Mixed Alignment");
    expect(alignmentLevel(75)).toBe("High Alignment");
    expect(alignmentLevel(49)).toBe("Low Alignment");
    expect(alignmentLevel(50)).toBe("Mixed Alignment");

    const { default: Page } =
      await import("../../app/play/dating-couples/couples-compatibility-test/page");
    const html = renderToStaticMarkup(createElement(Page));
    for (const interpretation of Object.values(ALIGNMENT_INTERPRETATION)) {
      expect(html).toContain(escaped(interpretation));
    }
  });
});

describe("Date Night page", () => {
  const PATH = "/play/dating-couples/date-night";
  const load = () => import("../../app/play/dating-couples/date-night/page");

  it("targets “date night questions” and keeps its canonical", async () => {
    const { metadata } = await load();
    expect(metadata.title).toBe("Date Night Questions for Couples: 60 by Mood — Sameeeish");
    expect(String(metadata.description)).toMatch(/date night questions/i);
    expect(String(metadata.description).length).toBeLessThanOrEqual(160);
    expect(metadata.alternates?.canonical).toBe(PATH);
    expect(metadata.robots).toBeUndefined();
    expect(DATE_NIGHT_QUESTIONS).toHaveLength(60);
    expect(MOODS).toHaveLength(6);
  });

  it("keeps the deck and its preview, then adds the guide below them", async () => {
    const { default: Page } = await load();
    const html = renderToStaticMarkup(createElement(Page));
    expect(html.match(/<h1[^>]*>/g)).toHaveLength(1);
    expect(html).toContain(">Date Night Questions</h1>");
    expect(html).toContain("Conversation Starters"); // subtitle, unchanged
    // The deck is client-only; its reserved slot renders first, then the
    // preview, then the guide.
    const deck = html.indexOf("dn-experience-slot");
    const preview = html.indexOf("A few questions to start with");
    const guide = html.indexOf("How to use these date night questions");
    expect(deck).toBeGreaterThan(-1);
    expect(preview).toBeGreaterThan(deck);
    expect(guide).toBeGreaterThan(preview);
    expect(html).not.toContain('name="gameId"');
  });

  it("describes each mood with the deck's own count", async () => {
    const { default: Page } = await load();
    const text = textOf(renderToStaticMarkup(createElement(Page)));
    for (const mood of MOODS) {
      const count = DATE_NIGHT_QUESTIONS.filter((q) => q.moods.includes(mood)).length;
      expect(text).toContain(`${MOOD_LABELS[mood]} · ${count} questions`);
    }
  });

  it("links to related experiences that exist, and stays in the sitemap and allowlist", async () => {
    const { default: Page } = await load();
    const hrefs = internalHrefs(renderToStaticMarkup(createElement(Page)));
    for (const href of [
      "/play/dating-couples",
      "/play/dating-couples/36-questions-to-fall-in-love",
      "/play/dating-couples/getting-to-know-each-other-questions",
      "/play/dating-couples/couples-compatibility-test",
    ]) {
      expect(hrefs, href).toContain(href);
    }
    expectRoutesExist(hrefs);
    expect(await sitemapUrls()).toContain(`https://sameeeish.com${PATH}`);
    expect(isPublicPath(PATH)).toBe(true);
  });
});

describe("experience pages", () => {
  it("every experience page has its own distinct title and description", async () => {
    const pages = [
      ...GAME_PAGES.map((page) => page.load()),
      import("../../app/play/dating-couples/getting-to-know-each-other-questions/page"),
      import("../../app/play/dating-couples/date-night/page"),
      import("../../app/play/dating-couples/36-questions-to-fall-in-love/page"),
      import("../../app/play/dating-couples/page"),
      import("../../app/play/friends/page"),
      import("../../app/for-couples/page"),
      import("../../app/for-friends/page"),
    ];
    const metadata = (await Promise.all(pages)).map((page) => page.metadata);
    const titles = metadata.map((m) => String(m.title));
    const descriptions = metadata.map((m) => String(m.description));
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });
});
