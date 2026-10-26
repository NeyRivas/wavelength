import { expect, test } from "@playwright/test";

import { GETTING_TO_KNOW_EACH_OTHER_QUESTIONS } from "../../lib/wavelength/ready-made-games";
import { questionCard } from "./utils/wavelength";

/**
 * The "Getting to know each other" journey after its catalog card became a
 * single link to the integrated experience page: Couples catalog card →
 * experience page → Start → A's own draft on /create, seeded with the
 * game's exact 12 questions, in order. Starting again from the page
 * resumes the same draft rather than creating a second one.
 *
 * Needs the real Supabase Anonymous Auth backend (see playwright.config.ts).
 */

const PAGE_PATH = "/play/dating-couples/getting-to-know-each-other-questions";

test("the catalog card opens the experience page, and Start seeds the 12 questions", async ({
  page,
}) => {
  await page.goto("/play/dating-couples");
  await page.getByRole("link", { name: /Getting to know each other/ }).click();
  await expect(page).toHaveURL(PAGE_PATH);
  await expect(
    page.getByRole("heading", { level: 1, name: "Getting to Know Each Other Questions" }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: /Start getting to know each other/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/create\?game=getting-to-know-you$/);

  for (const question of GETTING_TO_KNOW_EACH_OTHER_QUESTIONS) {
    await expect(questionCard(page, question.text)).toBeVisible();
  }
  const texts = await page
    .getByRole("article", { name: /^Question: / })
    .evaluateAll((cards) => cards.map((card) => card.getAttribute("aria-label")));
  expect(texts).toEqual(
    GETTING_TO_KNOW_EACH_OTHER_QUESTIONS.map((question) => `Question: ${question.text}`),
  );
});

test("starting again from the experience page resumes the same draft", async ({ page }) => {
  await page.goto(PAGE_PATH);
  await page
    .getByRole("button", { name: /Start getting to know each other/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/create\?game=getting-to-know-you$/);

  await page.goto(PAGE_PATH);
  await page
    .getByRole("button", { name: /Start getting to know each other/ })
    .last()
    .click();
  await expect(page).toHaveURL(/\/create\?game=getting-to-know-you$/);
  await expect(page.getByRole("article", { name: /^Question: / })).toHaveCount(
    GETTING_TO_KNOW_EACH_OTHER_QUESTIONS.length,
  );
});
