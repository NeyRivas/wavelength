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

const QUESTIONS = [
  { text: "Question one", options: ["A1", "A2"] },
  { text: "Question two", options: ["A1", "A2"] },
  { text: "Question three", options: ["A1", "A2"] },
  { text: "Question four", options: ["A1", "A2"] },
  { text: "Question five", options: ["A1", "A2"] },
];

/**
 * E2E — completed Result page actions (product decision): both A and B get
 * an identical "Share result" / "Create your own quiz" action group
 * (components/result/result-actions.tsx), and leaving the result from
 * either surface always confirms first via the shared dialog
 * (components/ui/confirm-dialog.tsx) rather than navigating immediately.
 *
 * "Share result" opens the Result Cards experience (components/result/
 * cards/) instead of the old plain-text Web Share sheet — Download now
 * lives inside that experience (components/result/cards/
 * result-cards-experience.tsx), saving an image of whichever card is
 * currently showing, rather than sitting in this row as its own
 * always-visible text-file button.
 *
 * Global QA/copy pass: "Create your own Wavelength" is now "Create your
 * own quiz" (no visible "Wavelength" branding anywhere — item #1), and
 * confirming now goes to `/play` (the game picker), not straight into
 * `/create` (item #12) — someone leaving a result could have come from
 * any ready-made game, not just Make Your Own.
 */
async function completeAWavelength(
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

  for (const q of QUESTIONS) {
    await answerChoice(answerRow(bPage, q.text), q.options[0]!);
  }
  await submitFinal(bPage);
  await expectResultVisible(bPage);

  return { bContext, bPage };
}

test("Result page shows Share result and Create your own quiz for both A and B", async ({
  page,
  browser,
}) => {
  const { bContext, bPage } = await completeAWavelength(page, browser);

  // A: still on the page finalizeDraft/redirect landed them on after B
  // completed — navigate there explicitly to render the actual Result page.
  await page.goto(page.url());
  await expectResultVisible(page);

  for (const target of [page, bPage]) {
    await expect(target.getByRole("button", { name: "Share result" })).toBeVisible();
    await expect(target.getByRole("button", { name: "Create your own quiz" })).toBeVisible();
    // Download is no longer a standalone action here — it now lives inside
    // the Result Cards experience opened by "Share result" (see below).
    await expect(target.getByRole("button", { name: "Download result" })).toHaveCount(0);
  }

  await bContext.close();
});

test("Share result opens the Result Cards experience, with navigation and a Download action for the current card", async ({
  page,
  browser,
}) => {
  const { bContext, bPage } = await completeAWavelength(page, browser);

  await bPage.getByRole("button", { name: "Share result" }).click();

  const dialog = bPage.getByRole("dialog", { name: "Sameeeish result cards" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Your result")).toBeVisible();

  await expect(dialog.getByRole("button", { name: "Download" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Share" })).toBeVisible();

  // "Next card"/"Previous card" also label the full-height invisible tap
  // zones (Stories-style tap-to-advance), so scope to the one visible
  // arrow button rather than getByRole, which would match both.
  const nextButton = dialog.locator('button[aria-label="Next card"]');

  // Step through all 4 cards via the visible arrow controls.
  await nextButton.click();
  await expect(dialog.getByText("You really clicked")).toBeVisible();
  await nextButton.click();
  await expect(dialog.getByText("Different rhythms")).toBeVisible();
  await nextButton.click();
  await expect(dialog.getByText("sameeeish")).toBeVisible();

  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(dialog).not.toBeVisible();
  // Closing the experience leaves the completed result underneath intact.
  await expectResultVisible(bPage);

  await bContext.close();
});

test("leaving the result requires confirmation, and Cancel leaves the current result untouched", async ({
  page,
  browser,
}) => {
  const { bContext, bPage } = await completeAWavelength(page, browser);

  await bPage.getByRole("button", { name: "Create your own quiz" }).click();

  const dialog = bPage.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Leave this result?" })).toBeVisible();
  await expect(
    dialog.getByText(
      "This result lives here for now. Make sure you've saved or shared what you want to keep — once you start a new one, you may not be able to come back to this result.",
    ),
  ).toBeVisible();

  // Clicking the trigger must not have navigated away yet.
  await expectResultVisible(bPage);

  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).not.toBeVisible();
  // Still looking at the same, untouched completed result.
  await expectResultVisible(bPage);

  await bContext.close();
});

test("Continue in the confirmation dialog goes to /play, without touching the completed result", async ({
  page,
  browser,
}) => {
  const { bContext, bPage } = await completeAWavelength(page, browser);
  const resultUrl = bPage.url();

  await bPage.getByRole("button", { name: "Create your own quiz" }).click();
  await bPage.getByRole("dialog").getByRole("button", { name: "Continue" }).click();

  await expect(bPage).toHaveURL(/\/play$/);
  await expect(bPage.getByRole("heading", { name: "What are you playing?" })).toBeVisible();

  // The completed result is untouched and still reachable at its own link.
  await bPage.goto(resultUrl);
  await expectResultVisible(bPage);

  await bContext.close();
});
