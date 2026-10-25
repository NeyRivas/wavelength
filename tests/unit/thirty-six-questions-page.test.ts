import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { isPublicPath } from "../../lib/analytics/ga-privacy-guard";
import {
  conversationQuestionTexts,
  THIRTY_SIX_QUESTIONS,
} from "../../lib/wavelength/conversation-experiences";
import { READY_MADE_GAMES } from "../../lib/wavelength/ready-made-games";

// The public SEO landing page for "36 Questions to Fall in Love", its
// sitemap entry, and its card in the Couples catalog.

// The CTA's server action pulls in the Supabase server client; the page
// itself never runs it during render.
vi.mock("@/app/actions/ready-made-games", () => ({ startReadyMadeGame: async () => {} }));
// next/font is compiled by Next itself; outside a Next build it's just a
// class-name provider.
vi.mock("next/font/google", () => {
  const font = () => ({ variable: "font", className: "font", style: {} });
  return { Fraunces: font, Nunito_Sans: font };
});

const PATH = "/play/dating-couples/36-questions-to-fall-in-love";

async function loadPage() {
  return import("../../app/play/dating-couples/36-questions-to-fall-in-love/page");
}

describe("36 Questions landing page", () => {
  it("has its own title, description, and canonical URL", async () => {
    const { metadata } = await loadPage();
    expect(metadata.title).toBe("36 Questions to Fall in Love — Sameeeish");
    expect(String(metadata.description)).toMatch(/36 questions to fall in love/i);
    expect(String(metadata.description).length).toBeLessThanOrEqual(170);
    expect(metadata.alternates?.canonical).toBe(PATH);
    expect(metadata.openGraph?.url).toBe(PATH);
    expect(metadata.robots).toBeUndefined(); // indexable
  });

  it("renders the H1, the research background, the three stages, FAQs, and the CTA", async () => {
    const { default: Page } = await loadPage();
    const html = renderToStaticMarkup(createElement(Page));

    expect(html.match(/<h1[^>]*>/g)).toHaveLength(1);
    expect(html).toMatch(/<h1[^>]*>36 Questions to Fall in Love<\/h1>/);
    expect(html).toContain("Arthur Aron");
    expect(html).toContain("Personality and Social Psychology Bulletin");
    expect(html).toContain("Mandy Len Catron");
    for (const stage of THIRTY_SIX_QUESTIONS.stages) {
      expect(html).toContain(stage.title);
    }
    // Every real question is on the page (server-rendered, crawlable).
    for (const question of conversationQuestionTexts(THIRTY_SIX_QUESTIONS)) {
      expect(html).toContain(question.replace(/'/g, "&#x27;"));
    }
    expect(html).toContain("Do the 36 questions really make people fall in love?");
    expect(html).toContain('name="gameId" value="36-questions-to-fall-in-love"');
    expect(html).toContain("Start the experience");
  });

  it("links to related couples experiences and back to the Couples catalog", async () => {
    const { default: Page } = await loadPage();
    const html = renderToStaticMarkup(createElement(Page));
    expect(html).toContain('href="/play/dating-couples/getting-to-know-each-other-questions"');
    expect(html).toContain('href="/play/dating-couples/date-night"');
    expect(html).toContain('href="/play/dating-couples"');
  });

  it("makes no score or love promises", async () => {
    const { default: Page } = await loadPage();
    const text = renderToStaticMarkup(createElement(Page)).replace(/<[^>]+>/g, " ");
    expect(text).not.toMatch(/guarantee|scientifically proven|compatibility score|match score/i);
  });

  it("is in the sitemap and on the analytics allowlist", async () => {
    const { default: sitemap } = await import("../../app/sitemap");
    expect(sitemap().map((entry) => entry.url)).toContain(`https://sameeeish.com${PATH}`);
    expect(isPublicPath(PATH)).toBe(true);
  });
});

describe("Couples catalog card", () => {
  it("lists the experience in Dating & Couples, linking to the landing page", () => {
    const game = READY_MADE_GAMES.find((g) => g.id === "36-questions-to-fall-in-love");
    expect(game).toMatchObject({
      title: "36 Questions to Fall in Love",
      description: "A guided conversation in three stages, designed to help you get closer.",
      group: "dating-couples",
      conversation: true,
      href: PATH,
    });
  });

  it("leaves the existing experiences in place", () => {
    expect(READY_MADE_GAMES.map((g) => g.id)).toEqual([
      "how-well-do-you-know-each-other",
      "getting-to-know-you",
      "date-night",
      "36-questions-to-fall-in-love",
      "how-well-do-you-know-me",
      "friendship-check",
    ]);
  });
});
