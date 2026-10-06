import { expect, test } from "@playwright/test";

import {
  addChoiceQuestion,
  answerChoice,
  answerRow,
  expectResultVisible,
  finalizeDraft,
  joinAsB,
  questionCard,
  startDraft,
  submitFinal,
} from "./utils/wavelength";

/**
 * QA follow-up pass (routing fix): "Create your own quiz" on every generic,
 * non-participant-specific screen now opens the game picker (`/play`),
 * never `/create` (Make Your Own's empty builder) directly — the viewer on
 * these screens never chose Make Your Own specifically, so "create your
 * own" should offer the same choice of experience anyone starting fresh
 * gets. This mirrors the Result page's own "Create your own quiz"
 * (components/result/create-new-wavelength-cta.tsx, already `/play`,
 * covered by tests/e2e/result-actions.spec.ts) — these three were the
 * stragglers still pointing at `/create`:
 * - WavelengthInProgressNotice ("This link is already in progress")
 * - ResultNotAvailableNotice ("Result not available")
 * - CreateNewWavelengthAction (B's "Nice try!" locked page)
 *
 * The one CTA that genuinely means "build my own questionnaire" —
 * /play's own "Make Your Own" card — still goes straight to `/create`,
 * checked here too so the two don't get conflated.
 */

const QUESTIONS = [
  { text: "Question one", options: ["A1", "A2"] },
  { text: "Question two", options: ["A1", "A2"] },
  { text: "Question three", options: ["A1", "A2"] },
  { text: "Question four", options: ["A1", "A2"] },
  { text: "Question five", options: ["A1", "A2"] },
];

async function buildAndClaimAWavelength(
  page: import("@playwright/test").Page,
  browser: import("@playwright/test").Browser,
) {
  await startDraft(page);
  for (const q of QUESTIONS) {
    await addChoiceQuestion(page, q);
    await answerChoice(questionCard(page, q.text), q.options[0]!);
  }
  const shareLink = await finalizeDraft(page, "Alex");

  const bContext = await browser.newContext();
  const bPage = await bContext.newPage();
  await joinAsB(bPage, shareLink, "Bailey");

  return { shareLink, bContext, bPage };
}

test("a third party on an already-claimed link gets 'Create your own quiz' pointing at /play, which shows all three experiences", async ({
  page,
  browser,
}) => {
  const { shareLink, bContext } = await buildAndClaimAWavelength(page, browser);

  // A fresh, unrelated visitor (new context = new Anonymous Auth identity,
  // neither A nor B) opens the same link once it already has two
  // participants.
  const strangerContext = await browser.newContext();
  const strangerPage = await strangerContext.newPage();
  await strangerPage.goto(shareLink);

  await expect(
    strangerPage.getByRole("heading", { name: "This link is already in progress" }),
  ).toBeVisible();
  await expect(strangerPage.getByText("It already has two participants.")).toBeVisible();

  await strangerPage.getByRole("link", { name: "Create your own quiz" }).click();
  await expect(strangerPage).toHaveURL(/\/play$/);
  await expect(strangerPage.getByRole("heading", { name: "What are you playing?" })).toBeVisible();
  await expect(strangerPage.getByRole("link", { name: "Dating & Couples" })).toBeVisible();
  await expect(strangerPage.getByRole("link", { name: "Friends" })).toBeVisible();
  await expect(strangerPage.getByRole("link", { name: "Make Your Own" })).toBeVisible();

  await strangerContext.close();
  await bContext.close();
});

test("B's 'Nice try!' locked page sends 'Create your own quiz' to /play, not straight into the builder", async ({
  page,
  browser,
}) => {
  const { shareLink, bContext, bPage } = await buildAndClaimAWavelength(page, browser);

  for (const q of QUESTIONS) {
    await answerChoice(answerRow(bPage, q.text), q.options[0]!);
  }
  await submitFinal(bPage);
  await expectResultVisible(bPage);

  // Navigating straight back to /answer once COMPLETED is the same,
  // reliable "Nice try!" guard submitFinalB's own redirect uses — no
  // reliance on browser back/bfcache behavior.
  await bPage.goto(`${shareLink}/answer`);
  await expect(bPage.getByRole("heading", { name: "Nice try! 😄" })).toBeVisible();

  await bPage.getByRole("button", { name: "Create your own quiz" }).click();
  await bPage.getByRole("dialog").getByRole("button", { name: "Continue" }).click();

  await expect(bPage).toHaveURL(/\/play$/);
  await expect(bPage.getByRole("heading", { name: "What are you playing?" })).toBeVisible();

  await bContext.close();
});

test("/play's own 'Make Your Own' card still goes straight to /create", async ({ page }) => {
  await page.goto("/play");
  await page.getByRole("link", { name: "Make Your Own" }).click();
  await expect(page).toHaveURL(/\/create$/);
  await expect(page.getByRole("heading", { name: "Make Your Own" })).toBeVisible();
});
