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
 * an identical "Download result" / "Share result" / "Create your own
 * Wavelength" action group (components/result/result-actions.tsx), and
 * starting a new Wavelength from either surface always confirms first via
 * the shared dialog (components/ui/confirm-dialog.tsx) rather than
 * navigating immediately.
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

test("Result page shows Download result, Share result, and Create your own Wavelength for both A and B", async ({
  page,
  browser,
}) => {
  const { bContext, bPage } = await completeAWavelength(page, browser);

  // A: still on the page finalizeDraft/redirect landed them on after B
  // completed — navigate there explicitly to render the actual Result page.
  await page.goto(page.url());
  await expectResultVisible(page);

  for (const target of [page, bPage]) {
    await expect(target.getByRole("button", { name: "Download result" })).toBeVisible();
    await expect(target.getByRole("button", { name: "Share result" })).toBeVisible();
    await expect(target.getByRole("button", { name: "Create your own Wavelength" })).toBeVisible();
  }

  await bContext.close();
});

test("starting a new Wavelength requires confirmation, and Cancel leaves the current result untouched", async ({
  page,
  browser,
}) => {
  const { bContext, bPage } = await completeAWavelength(page, browser);

  await bPage.getByRole("button", { name: "Create your own Wavelength" }).click();

  const dialog = bPage.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Start a new Wavelength?" })).toBeVisible();
  await expect(
    dialog.getByText(
      "Make sure you've saved or shared your current result first. You may lose access to this completed result when you start a new Wavelength.",
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

test("Continue in the confirmation dialog goes to /create, without touching the completed Wavelength", async ({
  page,
  browser,
}) => {
  const { bContext, bPage } = await completeAWavelength(page, browser);
  const resultUrl = bPage.url();

  await bPage.getByRole("button", { name: "Create your own Wavelength" }).click();
  await bPage.getByRole("dialog").getByRole("button", { name: "Continue" }).click();

  await expect(bPage).toHaveURL(/\/create$/);
  await expect(
    bPage.getByRole("heading", { name: /Create your Wavelength|Build your questionnaire/ }),
  ).toBeVisible();

  // The completed Wavelength is untouched and still reachable at its own
  // link — this new draft is a fully independent Wavelength.
  await bPage.goto(resultUrl);
  await expectResultVisible(bPage);

  await bContext.close();
});
