import { expect, test } from "@playwright/test";

/**
 * The unified /play catalog in a real browser: every card opens its
 * experience page, Make Your Own points at the existing /create builder,
 * and the catalog pages never scroll sideways at phone, tablet, or desktop
 * widths. Nothing here reaches Supabase-backed routes (opening /create
 * itself is covered by create-your-own-quiz-routing.spec.ts).
 */

const CARDS = [
  {
    name: /Are we on the same page\?/,
    path: "/play/dating-couples/couples-compatibility-test",
    h1: "Couples Compatibility Test",
  },
  {
    name: /Getting to Know Each Other/,
    path: "/play/dating-couples/getting-to-know-each-other-questions",
    h1: "Getting to Know Each Other Questions",
  },
  {
    name: /36 Questions to Fall in Love/,
    path: "/play/dating-couples/36-questions-to-fall-in-love",
    h1: "36 Questions to Fall in Love",
  },
  {
    name: /Date Night Questions/,
    path: "/play/dating-couples/date-night",
    h1: "Date Night Questions",
  },
  {
    name: /How Well Do You Know Me\?/,
    path: "/play/friends/how-well-do-you-know-me",
    h1: "How Well Do You Know Me?",
  },
  {
    name: /Friendship Test/,
    path: "/play/friends/friendship-test",
    h1: "Friendship Test",
  },
] as const;

test("/play shows the three sections in order", async ({ page }) => {
  await page.goto("/play");
  await expect(
    page.getByRole("heading", { level: 1, name: "What are you playing?" }),
  ).toBeVisible();
  const sections = await page.getByRole("heading", { level: 2 }).allInnerTexts();
  expect(sections.slice(0, 3)).toEqual([
    "Couples Games & Questions",
    "Friendship Quizzes & Games",
    "Make Your Own",
  ]);
  await expect(page.locator(".catalog-card")).toHaveCount(6);
  await expect(page.locator(".catalog-card__cta")).toHaveText(Array(6).fill("Play →"));
});

for (const card of CARDS) {
  test(`/play → ${card.h1}`, async ({ page }) => {
    await page.goto("/play");
    await page.getByRole("link", { name: card.name }).click();
    await expect(page).toHaveURL(card.path);
    await expect(page.getByRole("heading", { level: 1, name: card.h1 })).toBeVisible();
  });
}

test("Make Your Own points at the existing /create builder", async ({ page }) => {
  await page.goto("/play");
  const link = page.getByRole("link", { name: /Create your game/ });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", "/create");
  await expect(link).toContainText("Your Questions, Your Rules");
  await expect(link).toContainText("Create Your Own Game");
});

for (const width of [390, 768, 1280]) {
  test(`catalog pages have no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/play", "/play/dating-couples", "/play/friends"]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(overflow, `${path} at ${width}px`).toBe(false);
    }
  });
}
