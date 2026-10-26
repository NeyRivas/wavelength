import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { isPublicPath } from "../../lib/analytics/ga-privacy-guard";
import { CATEGORY_LABELS } from "../../lib/wavelength/categories";
import {
  getReadyMadeGame,
  GETTING_TO_KNOW_EACH_OTHER_QUESTIONS,
} from "../../lib/wavelength/ready-made-games";

// The integrated "Getting to know each other" experience page: metadata,
// structure, every real question rendered from the game's own data, the
// Start buttons, internal links, sitemap, and analytics allowlist.

vi.mock("@/app/actions/ready-made-games", () => ({ startReadyMadeGame: async () => {} }));
vi.mock("next/font/google", () => {
  const font = () => ({ variable: "font", className: "font", style: {} });
  return { Fraunces: font, Nunito_Sans: font };
});

const PATH = "/play/dating-couples/getting-to-know-each-other-questions";

async function loadPage() {
  return import("../../app/play/dating-couples/getting-to-know-each-other-questions/page");
}

async function renderPage() {
  const { default: Page } = await loadPage();
  return renderToStaticMarkup(createElement(Page));
}

// React escapes apostrophes and ampersands in text.
const escaped = (text: string) => text.replace(/&/g, "&amp;").replace(/'/g, "&#x27;");
const textOf = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ");

describe("Getting to know each other page: metadata", () => {
  it("has the approved title and description, and keeps its canonical URL", async () => {
    const { metadata } = await loadPage();
    expect(metadata.title).toBe("Getting to Know You Questions for Couples — Sameeeish");
    expect(metadata.description).toBe(
      "12 getting to know you questions for couples and early dates. Answer on your own, send the link, then see where you match. Free, no sign-up.",
    );
    expect(String(metadata.description).length).toBeLessThanOrEqual(160);
    expect(metadata.alternates?.canonical).toBe(PATH);
    expect(metadata.openGraph?.url).toBe(PATH);
    expect(metadata.openGraph?.title).toBe(metadata.title);
    expect(metadata.twitter?.title).toBe(metadata.title);
    expect(metadata.robots).toBeUndefined(); // indexable
  });

  it("claims exactly as many questions as the game has", async () => {
    const { metadata } = await loadPage();
    expect(GETTING_TO_KNOW_EACH_OTHER_QUESTIONS).toHaveLength(12);
    expect(String(metadata.description)).toMatch(
      new RegExp(`^${GETTING_TO_KNOW_EACH_OTHER_QUESTIONS.length} `),
    );
  });
});

describe("Getting to know each other page: content", () => {
  it("has one H1 and every planned section", async () => {
    const html = await renderPage();
    expect(html.match(/<h1[^>]*>/g)).toHaveLength(1);
    expect(html).toMatch(/<h1[^>]*>Getting to Know Each Other Questions<\/h1>/);
    for (const heading of [
      "How it works",
      "All 12 questions",
      "When to use them",
      "Turning an answer into a conversation",
      "What these questions leave for later",
      "Start with the first question",
      "Questions people ask",
      "More for the two of you",
    ]) {
      expect(html, heading).toContain(heading);
    }
  });

  it("renders all 12 questions from the game's data, in order, with categories and options", async () => {
    const html = await renderPage();
    let previous = -1;
    for (const question of GETTING_TO_KNOW_EACH_OTHER_QUESTIONS) {
      const at = html.indexOf(escaped(question.text));
      expect(at, question.text).toBeGreaterThan(previous);
      previous = at;
      for (const option of question.options ?? []) {
        expect(html, option).toContain(escaped(option));
      }
    }
    for (const category of new Set(GETTING_TO_KNOW_EACH_OTHER_QUESTIONS.map((q) => q.category))) {
      expect(html).toContain(escaped(CATEGORY_LABELS[category]));
    }
  });

  it("only offers Start buttons for this game, and never the old “More” link", async () => {
    const html = await renderPage();
    const forms = html.match(/name="gameId" value="[^"]*"/g) ?? [];
    expect(forms).toEqual([
      'name="gameId" value="getting-to-know-you"',
      'name="gameId" value="getting-to-know-you"',
    ]);
    expect(textOf(html)).toContain("Start getting to know each other");
    expect(html).not.toContain("game-card__more");
  });

  it("describes the result accurately (the game does show a percentage)", async () => {
    const text = textOf(await renderPage());
    expect(text).not.toMatch(/no score/i);
    expect(text).toContain("how aligned your answers are as a percentage");
    expect(text).not.toMatch(/guarantee|scientifically proven/i);
  });
});

describe("Getting to know each other page: links", () => {
  it("links back to the Couples catalog and to related experiences that exist", async () => {
    const html = await renderPage();
    const hrefs = [...html.matchAll(/href="(\/[^"#?]*)"/g)].map((match) => match[1]!);
    for (const href of [
      "/play/dating-couples",
      "/play/dating-couples/36-questions-to-fall-in-love",
      "/play/dating-couples/date-night",
      "/play/friends",
    ]) {
      expect(hrefs, href).toContain(href);
    }

    // Every internal link on the page resolves to a real app route.
    const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../app");
    for (const href of new Set(hrefs)) {
      const segments = href === "/" ? [] : href.slice(1).split("/");
      const dir = path.join(appDir, ...segments);
      expect(readdirSync(dir), href).toContain("page.tsx");
    }
  });

  it("is what the Couples catalog card links to", () => {
    const game = getReadyMadeGame("getting-to-know-you");
    expect(game?.href).toBe(PATH);
    expect(game?.questions).toBe(GETTING_TO_KNOW_EACH_OTHER_QUESTIONS);
  });

  it("is in the sitemap and on the analytics allowlist", async () => {
    const { default: sitemap } = await import("../../app/sitemap");
    expect(sitemap().map((entry) => entry.url)).toContain(`https://sameeeish.com${PATH}`);
    expect(isPublicPath(PATH)).toBe(true);
  });
});
