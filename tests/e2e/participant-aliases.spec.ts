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
 * Bug-fix pass: the result screen must show both participants' actual
 * aliases everywhere identity is displayed — never the bare internal "A"/
 * "B" labels. Builds the full real flow (create → finalize → join → answer
 * → submit → result) with distinctive alias names chosen specifically so
 * they can't be confused with the internal labels they replace.
 */
test("the shared result shows both participants' real aliases, never bare 'A'/'B'", async ({
  page,
  browser,
}) => {
  await startDraft(page);
  for (const q of QUESTIONS) {
    await addChoiceQuestion(page, q);
    await answerChoice(questionCard(page, q.text), q.options[0]!);
  }
  const shareLink = await finalizeDraft(page, "Ney");

  const bContext = await browser.newContext();
  const bPage = await bContext.newPage();
  await joinAsB(bPage, shareLink, "Sarah");
  for (const q of QUESTIONS) {
    await answerChoice(answerRow(bPage, q.text), q.options[0]!);
  }
  await submitFinal(bPage);
  await expectResultVisible(bPage);

  // Header names both aliases.
  await expect(
    bPage.getByRole("heading", { name: "Are Ney and Sarah on the same wavelength?" }),
  ).toBeVisible();

  // Question-level comparisons show the aliases, not "A"/"B".
  await expect(bPage.getByText("Ney", { exact: true }).first()).toBeVisible();
  await expect(bPage.getByText("Sarah", { exact: true }).first()).toBeVisible();
  await expect(bPage.getByText("A", { exact: true })).toHaveCount(0);
  await expect(bPage.getByText("B", { exact: true })).toHaveCount(0);

  await bContext.close();
});
