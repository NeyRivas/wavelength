import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { CATALOG_SECTIONS, MAKE_YOUR_OWN } from "../../lib/wavelength/catalog";
import { getReadyMadeGame } from "../../lib/wavelength/ready-made-games";

// The unified game catalog: /play shows every experience in three sections
// (Couples, Friends, Make Your Own), and /play/dating-couples and
// /play/friends render their own section. Every ready-made card has the
// same four parts in the same order — title, category subtitle,
// description, one "Play →" CTA — and is a single link to its game's
// experience page.

vi.mock("@/app/actions/ready-made-games", () => ({ startReadyMadeGame: async () => {} }));
vi.mock("next/font/google", () => {
  const font = () => ({ variable: "font", className: "font", style: {} });
  return { Fraunces: font, Nunito_Sans: font };
});

const APP_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../app");

// The approved catalog, exactly as specified.
const EXPECTED = {
  "dating-couples": {
    heading: "Couples Games & Questions",
    intro:
      "Four ways to learn something new about each other. See where you're aligned on the big topics, get to know each other a little better, go deeper with 36 questions, or pick a date night question and see where it goes.",
    cards: [
      {
        title: "Are we on the same page?",
        subtitle: "Compatibility Quiz",
        description:
          "Discover where you and your partner align and differ on the important topics in your relationship.",
        href: "/play/dating-couples/couples-compatibility-test",
      },
      {
        title: "Getting to Know Each Other",
        subtitle: "Discovery & Conversation",
        description:
          "Explore each other's values, lifestyle, preferences, and perspectives through 12 multiple-choice questions.",
        href: "/play/dating-couples/getting-to-know-each-other-questions",
      },
      {
        title: "36 Questions to Fall in Love",
        subtitle: "Deeper Conversations",
        description:
          "Answer meaningful questions together and discover new things about each other, one conversation at a time.",
        href: "/play/dating-couples/36-questions-to-fall-in-love",
      },
      {
        title: "Date Night Questions",
        subtitle: "Date Night & Conversation",
        description:
          "Choose a mood, pick a question, and see where the conversation takes you on your next date night.",
        href: "/play/dating-couples/date-night",
      },
    ],
  },
  friends: {
    heading: "Friendship Quizzes & Games",
    intro:
      "Two guessing games for you and a friend. Find out how well they know you, or how well they remember the moments you've shared.",
    cards: [
      {
        title: "How Well Do You Know Me?",
        subtitle: "Best Friend Quiz",
        description:
          "Find out how well your friend knows your personality, preferences, and the little details that make you you.",
        href: "/play/friends/how-well-do-you-know-me",
      },
      {
        title: "Friendship Test",
        subtitle: "Shared Memories",
        description:
          "See how well you and your friend remember the moments, stories, and experiences you've shared.",
        href: "/play/friends/friendship-test",
      },
    ],
  },
} as const;

const EXPECTED_MAKE_YOUR_OWN = {
  heading: "Make Your Own",
  intro:
    "Make it personal. Choose the questions that matter to you, answer them first, and invite someone to see where you're on the same page.",
  title: "Your Questions, Your Rules",
  subtitle: "Create Your Own Game",
  description:
    "Build a personal questionnaire, choose your topics, answer the questions yourself, and share a private link with your partner or friend.",
  cta: "Create your game →",
  href: "/create",
};

const decode = (html: string) =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

/** Every ready-made card on a page, parsed into its parts in DOM order. */
function parseCards(html: string) {
  return [
    ...html.matchAll(/<a class="catalog-card catalog-card--\w+" href="([^"]+)">(.*?)<\/a>/g),
  ].map(([, href, inner]) => {
    const parts = [
      ...inner!.matchAll(
        /<(h3|p|span) class="catalog-card__(title|subtitle|description|cta)">(.*?)<\/\1>/g,
      ),
    ];
    return {
      href,
      order: parts.map((part) => part[2]),
      tags: parts.map((part) => part[1]),
      title: decode(parts.find((part) => part[2] === "title")?.[3] ?? ""),
      subtitle: decode(parts.find((part) => part[2] === "subtitle")?.[3] ?? ""),
      description: decode(parts.find((part) => part[2] === "description")?.[3] ?? ""),
      cta: decode(parts.find((part) => part[2] === "cta")?.[3] ?? ""),
    };
  });
}

async function renderPage(load: () => Promise<{ default: () => React.ReactElement }>) {
  const { default: Page } = await load();
  return renderToStaticMarkup(createElement(Page));
}

const loadPlay = () => import("../../app/play/page");
const loadCouples = () => import("../../app/play/dating-couples/page");
const loadFriends = () => import("../../app/play/friends/page");

function expectCard(
  card: ReturnType<typeof parseCards>[number],
  expected: (typeof EXPECTED)[keyof typeof EXPECTED]["cards"][number],
) {
  expect(card.order, expected.title).toEqual(["title", "subtitle", "description", "cta"]);
  expect(card.tags).toEqual(["h3", "p", "p", "span"]);
  expect(card.title).toBe(expected.title);
  expect(card.subtitle).toBe(expected.subtitle);
  expect(card.description).toBe(expected.description);
  expect(card.cta).toBe("Play →");
  expect(card.href).toBe(expected.href);
  expect(card.title).not.toBe(card.subtitle);
}

describe("/play: the unified catalog", () => {
  it("keeps its title, canonical, and H1", async () => {
    const { metadata } = await loadPlay();
    expect(metadata.title).toBe("What Are You Playing? — Sameeeish");
    expect(metadata.alternates?.canonical).toBe("/play");
    expect(metadata.robots).toBeUndefined();
    const html = await renderPage(loadPlay);
    expect(html.match(/<h1[^>]*>/g)).toHaveLength(1);
    expect(html).toMatch(/<h1[^>]*>What are you playing\?<\/h1>/);
  });

  it("has exactly three sections, in order: Couples, Friends, Make Your Own", async () => {
    const html = await renderPage(loadPlay);
    const headings = [
      ...html.matchAll(/<h2[^>]*class="catalog-section__heading"[^>]*>(.*?)<\/h2>/g),
    ].map((m) => decode(m[1]!));
    expect(headings).toEqual([
      "Couples Games & Questions",
      "Friendship Quizzes & Games",
      "Make Your Own",
    ]);
    expect(html.match(/<section class="catalog-section"/g)).toHaveLength(3);
  });

  it("uses the exact section introductions", async () => {
    const text = decode(await renderPage(loadPlay));
    expect(text).toContain(EXPECTED["dating-couples"].intro);
    expect(text).toContain(EXPECTED.friends.intro);
    expect(text).toContain(EXPECTED_MAKE_YOUR_OWN.intro);
  });

  it("shows all six ready-made experiences (seven cards with Make Your Own) with title, subtitle, description, and one Play CTA, in that order", async () => {
    const cards = parseCards(await renderPage(loadPlay));
    const expected = [...EXPECTED["dating-couples"].cards, ...EXPECTED.friends.cards];
    expect(cards).toHaveLength(expected.length);
    cards.forEach((card, index) => expectCard(card, expected[index]!));
  });

  it("links each card to the existing experience page, once, and never starts a game itself", async () => {
    const html = await renderPage(loadPlay);
    for (const { href } of [...EXPECTED["dating-couples"].cards, ...EXPECTED.friends.cards]) {
      expect(html.match(new RegExp(`href="${href}"`, "g")), href).toHaveLength(1);
      const segments = href.slice(1).split("/");
      expect(readdirSync(path.join(APP_DIR, ...segments)), href).toContain("page.tsx");
    }
    expect(html).not.toContain('name="gameId"');
    expect(html).not.toMatch(/>More</);
  });

  it("shows Make Your Own as its own card leading to the existing /create builder", async () => {
    const html = await renderPage(loadPlay);
    const match = html.match(
      /<a href="([^"]+)" class="catalog-create">(.*?)<\/a>|<a class="catalog-create" href="([^"]+)">(.*?)<\/a>/,
    );
    expect(match, "Make Your Own card").not.toBeNull();
    const href = match![1] ?? match![3];
    const inner = match![2] ?? match![4]!;
    expect(href).toBe(EXPECTED_MAKE_YOUR_OWN.href);
    const order = [
      ...inner.matchAll(/class="catalog-card__(title|subtitle|description)[^"]*"/g),
    ].map((m) => m[1]);
    expect(order).toEqual(["title", "subtitle", "description"]);
    const text = decode(inner);
    for (const part of [
      EXPECTED_MAKE_YOUR_OWN.title,
      EXPECTED_MAKE_YOUR_OWN.subtitle,
      EXPECTED_MAKE_YOUR_OWN.description,
      EXPECTED_MAKE_YOUR_OWN.cta,
    ]) {
      expect(text).toContain(part);
    }
    expect(text.indexOf(EXPECTED_MAKE_YOUR_OWN.description)).toBeLessThan(
      text.indexOf(EXPECTED_MAKE_YOUR_OWN.cta),
    );
    expect(readdirSync(path.join(APP_DIR, "create"))).toContain("page.tsx");
  });

  it("is built from the catalog data, whose destinations are the games' own pages", () => {
    expect(CATALOG_SECTIONS.map((s) => s.group)).toEqual(["dating-couples", "friends"]);
    for (const section of CATALOG_SECTIONS) {
      for (const card of section.cards) {
        expect(getReadyMadeGame(card.gameId)?.href, card.gameId).toBeTruthy();
      }
    }
    expect(MAKE_YOUR_OWN.href).toBe("/create");
  });
});

for (const [group, load, title] of [
  ["dating-couples", loadCouples, "Couples Games & Questions — Sameeeish"],
  ["friends", loadFriends, "Friendship Quizzes & Games — Sameeeish"],
] as const) {
  describe(`/play/${group}: its own section of the catalog`, () => {
    it("keeps its positioning, canonical, and indexability", async () => {
      const { metadata } = await load();
      expect(metadata.title).toBe(title);
      expect(metadata.alternates?.canonical).toBe(`/play/${group}`);
      expect(metadata.robots).toBeUndefined();
    });

    it("renders the same section, with its heading as the page's only H1", async () => {
      const html = await renderPage(load);
      expect(html.match(/<h1[^>]*>/g)).toHaveLength(1);
      expect(html).toContain(`>${EXPECTED[group].heading.replace(/&/g, "&amp;")}</h1>`);
      expect(decode(html)).toContain(EXPECTED[group].intro);
      const cards = parseCards(html);
      expect(cards).toHaveLength(EXPECTED[group].cards.length);
      cards.forEach((card, index) => expectCard(card, EXPECTED[group].cards[index]!));
      expect(html).not.toContain('name="gameId"');
    });
  });
}

describe("informational pages", () => {
  it("/for-couples keeps “Questions for Couples”", async () => {
    const { metadata } = await import("../../app/for-couples/page");
    expect(metadata.title).toBe("Questions for Couples — Sameeeish");
    expect(metadata.alternates?.canonical).toBe("/for-couples");
  });

  it("/for-friends keeps its title and links each friends game to its experience page", async () => {
    const { metadata, default: Page } = await import("../../app/for-friends/page");
    expect(metadata.title).toBe("Questions for Friends — Sameeeish");
    const html = renderToStaticMarkup(createElement(Page));
    for (const { href } of EXPECTED.friends.cards) {
      expect(html).toContain(`href="${href}"`);
    }
  });
});
