import { expect, test } from "@playwright/test";

import { answerQuizChoice, submitFinal, writeQuizOptions } from "./utils/wavelength";

/**
 * QA follow-up pass regression guard (item #1/#2): Friendship Check's
 * result used to show a standalone "{aliasB} got X out of 12 right." line
 * immediately followed by an interpretation sentence stating the exact
 * same count ("{aliasB} got X of {aliasA}'s 12 friendship moments
 * right.") — two consecutive lines communicating the same information.
 * The first line was removed (components/result/
 * friendship-memory-summary.tsx); the interpretation sentence and the
 * tier headline stay.
 *
 * Typography cleanup pass: the animated SAMEEEISH/SAMEEE flourish that
 * used to sit below the interpretation line is gone too (components/
 * result/sameeeish-reveal.tsx, deleted) — this spec now also guards
 * against it quietly coming back.
 *
 * Drives the real ready-made "Friendship Check" flow end to end (no
 * shortcuts), through the guided quiz on both sides: these questions ship
 * with unwritten (blank) answer options — A types both options in and
 * marks the "correct" one on each question's own screen, and B taps their
 * guess. Every question gets the exact same two option strings so B
 * can trivially match all of them (this game's "excellent" tier),
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

test("Friendship Check's result shows the memory count exactly once, with no animated SAMEEEISH flourish", async ({
  page,
  browser,
}) => {
  await page.goto("/play/friends/friendship-test");
  await page
    .getByRole("button", { name: /Make your friendship test/ })
    .first()
    .click();
  for (const text of FRIENDSHIP_CHECK_QUESTIONS) {
    await writeQuizOptions(page, text, [OPTION_A, OPTION_B], OPTION_A);
  }

  await expect(page.getByRole("heading", { name: "That's every question" })).toBeVisible();
  await page.getByLabel("Your name").fill("Alex");
  await page
    .getByRole("button", { name: "Lock it in. Share it. See how well they remember." })
    .click();
  await expect(page.getByRole("heading", { name: "Your answers are in." })).toBeVisible();
  const shareLink = await page.locator("#share-link").inputValue();

  const bContext = await browser.newContext();
  const bPage = await bContext.newPage();
  await bPage.goto(shareLink);
  await bPage.getByLabel("Your name").fill("Bailey");
  await bPage.getByRole("button", { name: "Start answering" }).click();

  for (const text of FRIENDSHIP_CHECK_QUESTIONS) {
    await answerQuizChoice(bPage, text, OPTION_A);
  }
  await expect(bPage.getByRole("heading", { name: "That's every question" })).toBeVisible();
  await submitFinal(bPage);

  await expect(bPage.locator("#friendship-memory-heading")).toBeVisible({ timeout: 10_000 });

  // The one place the count appears: "Bailey got 12 of Alex's 12
  // friendship moments right." — never a second, separate line repeating
  // the same "X out of Y" fact.
  await expect(bPage.getByText("got 12 of Alex's 12 friendship moments right")).toBeVisible();
  await expect(bPage.getByText(/out of \d+ right/)).toHaveCount(0);

  // Typography cleanup pass: no animated SAMEEEISH/SAMEEE wordmark
  // anywhere on the result, regardless of tier.
  await expect(bPage.getByText("SAMEEEISH!", { exact: true })).toHaveCount(0);
  await expect(bPage.getByText("SAMEEE!", { exact: true })).toHaveCount(0);

  await bContext.close();
});
