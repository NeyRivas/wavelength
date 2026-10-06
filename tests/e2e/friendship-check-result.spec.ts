import { expect, test } from "@playwright/test";

import { answerChoice, answerRow, joinAsB, questionCard, submitFinal } from "./utils/wavelength";

/**
 * QA follow-up pass regression guard (item #1/#2): Friendship Check's
 * result used to show a standalone "{aliasB} got X out of 12 right." line
 * immediately followed by an interpretation sentence stating the exact
 * same count ("{aliasB} got X of {aliasA}'s 12 friendship moments
 * right.") — two consecutive lines communicating the same information.
 * The first line was removed (components/result/
 * friendship-memory-summary.tsx); the interpretation sentence, the tier
 * headline, and the shared SameeeishWordmark reaction all stay.
 *
 * Drives the real ready-made "Friendship Check" flow end to end (no
 * shortcuts): these questions ship with unwritten (blank) answer options
 * — A has to type both options in before picking the "correct" one, same
 * as tests/e2e/option-persists-after-save.spec.ts already does for one
 * question. Every question gets the exact same two option strings so B
 * can trivially match all of them (an "excellent" tier/celebrate result),
 * without that detail affecting what's being asserted here.
 */

const FRIENDSHIP_CHECK_QUESTIONS = [
  "Where did we first meet?",
  "What was the first thing we ever did together?",
  "What’s the dumbest thing we’ve ever laughed about together?",
  "What’s something we’ve done together that sounded like a good idea at the time?",
  "What’s the most embarrassing thing we’ve experienced together?",
  "What’s an inside joke between us that would make absolutely no sense to anyone else?",
  "What’s something that happened between us that we still randomly bring up?",
  "What’s a place, trip, or night out that instantly makes me think of you?",
  "What’s the most “us” thing we’ve ever done?",
  "What’s a phrase, song, place, or random thing that will always remind us of each other?",
  "What’s a moment between us that I would happily relive?",
  "What’s one story about us that we’ll probably still be telling years from now?",
];

const OPTION_A = "Memory A";
const OPTION_B = "Memory B";

test("Friendship Check's result shows the memory count exactly once, alongside the shared SAMEEE! reaction", async ({
  page,
  browser,
}) => {
  await page.goto("/play/friends");
  await page.getByRole("button", { name: /Friendship Check/ }).click();
  await expect(page.getByRole("heading", { name: "Build your questionnaire" })).toBeVisible();

  for (const text of FRIENDSHIP_CHECK_QUESTIONS) {
    const card = questionCard(page, text);
    const optionInputs = card.locator('input[name="options"]');
    const editForm = optionInputs.first().locator("xpath=ancestor::form[1]");

    await optionInputs.nth(0).fill(OPTION_A);
    await optionInputs.nth(0).blur();
    await expect(editForm.getByText("Saved", { exact: true })).toBeVisible();

    await optionInputs.nth(1).fill(OPTION_B);
    await optionInputs.nth(1).blur();
    await expect(editForm.getByText("Saved", { exact: true })).toBeVisible();

    await answerChoice(card, OPTION_A);
  }

  await page.getByLabel("Your name").fill("Alex");
  await page
    .getByRole("button", { name: "Lock it in. Share it. See how well they remember." })
    .click();
  await expect(page.getByRole("heading", { name: "Your answers are in." })).toBeVisible();
  const shareLink = await page.locator("#share-link").inputValue();

  const bContext = await browser.newContext();
  const bPage = await bContext.newPage();
  await joinAsB(bPage, shareLink, "Bailey");

  for (const text of FRIENDSHIP_CHECK_QUESTIONS) {
    await answerChoice(answerRow(bPage, text), OPTION_A);
  }
  await submitFinal(bPage);

  await expect(bPage.locator("#friendship-memory-heading")).toBeVisible({ timeout: 10_000 });

  // The one place the count appears: "Bailey got 12 of Alex's 12
  // friendship moments right." — never a second, separate line repeating
  // the same "X out of Y" fact.
  await expect(bPage.getByText("got 12 of Alex's 12 friendship moments right")).toBeVisible();
  await expect(bPage.getByText(/out of \d+ right/)).toHaveCount(0);

  // A perfect match is this game's "excellent" tier, which stops the
  // shared brand reaction at the shorter SAMEEE! instead of completing
  // SAMEEEISH! — same component, same system as the result-reveal
  // transition B just watched to get here.
  await expect(bPage.getByText("SAMEEE!", { exact: true })).toBeVisible();

  await bContext.close();
});
