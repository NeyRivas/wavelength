import { expect, test } from "@playwright/test";

import { DATE_NIGHT_QUESTIONS } from "../../lib/date-night/questions";
import { getReadyMadeGame } from "../../lib/wavelength/ready-made-games";
import { questionCard } from "./utils/wavelength";

/**
 * The integrated experience pages added in the SEO plan: each catalog card
 * opens its game's page, and the page's Start button seeds A's own draft
 * with the game's exact questions (Supabase-backed, like every flow that
 * reaches /create — see playwright.config.ts). Plus Date Night, whose deck
 * must keep working with the guide added below it (no backend needed).
 */

const GAME_FLOWS = [
  {
    catalog: "/play/friends",
    card: /How Well Do You Know Me\?/,
    path: "/play/friends/how-well-do-you-know-me",
    h1: "How Well Do You Know Me?",
    start: /Make your quiz/,
    gameId: "how-well-do-you-know-me",
  },
  {
    catalog: "/play/friends",
    card: /Friendship Check/,
    path: "/play/friends/friendship-test",
    h1: "Friendship Test",
    start: /Make your friendship test/,
    gameId: "friendship-check",
  },
  {
    catalog: "/play/dating-couples",
    card: /Are we on the same page\?/,
    path: "/play/dating-couples/couples-compatibility-test",
    h1: "Couples Compatibility Test",
    start: /Start the compatibility test/,
    gameId: "how-well-do-you-know-each-other",
  },
] as const;

for (const flow of GAME_FLOWS) {
  test(`${flow.h1}: catalog card → experience page → Start seeds the game's questions`, async ({
    page,
  }) => {
    await page.goto(flow.catalog);
    await page.getByRole("link", { name: flow.card }).click();
    await expect(page).toHaveURL(flow.path);
    await expect(page.getByRole("heading", { level: 1, name: flow.h1 })).toBeVisible();

    await page.getByRole("button", { name: flow.start }).first().click();
    await expect(page).toHaveURL(new RegExp(`/create\\?game=${flow.gameId}$`));

    const questions = getReadyMadeGame(flow.gameId)!.questions!;
    for (const question of questions) {
      await expect(questionCard(page, question.text)).toBeVisible();
    }
    await expect(page.getByRole("article", { name: /^Question: / })).toHaveCount(questions.length);
  });
}

test("Date Night: the deck still filters, shuffles, searches, and saves favorites", async ({
  page,
}) => {
  await page.goto("/play/dating-couples/date-night");
  await expect(page.getByRole("heading", { level: 1, name: "Date Night Questions" })).toBeVisible();

  await page.getByRole("tab", { name: "Deep" }).click();
  await expect(page.getByRole("tab", { name: "Deep" })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("button", { name: /Next/ }).click();
  await page.getByRole("button", { name: /Shuffle/ }).click();

  await page.getByRole("tab", { name: "All" }).click();
  await page.getByRole("searchbox", { name: "Search questions" }).fill("first");
  await expect(page.locator(".dn-card-stage")).toContainText(/first/i);
  await page.getByRole("searchbox", { name: "Search questions" }).fill("");

  await page.locator(".dn-card-stage").getByRole("button", { name: "Save to favorites" }).click();
  await expect(page.locator(".dn-favorites__list li")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".dn-favorites__list li")).toHaveCount(1);

  await expect(page.locator(".dn-experience .dn-browse-item")).toHaveCount(
    DATE_NIGHT_QUESTIONS.length,
  );
  await expect(
    page.getByRole("heading", { name: "How to use these date night questions" }),
  ).toBeVisible();
});
