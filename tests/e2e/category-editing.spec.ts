import { expect, test } from "@playwright/test";

import {
  addChoiceQuestion,
  answerChoice,
  answerSavedStatus,
  questionCard,
  startDraft,
} from "./utils/wavelength";

/**
 * Bug-fix pass: category editing before sharing is an intentional product
 * requirement (it was previously DB-immutable unconditionally, which was
 * wrong). The category `<select>` lives inside question-edit-form.tsx,
 * submitting on change (same auto-save pattern as the Type selector) —
 * there is no separate "Save" step, and no confirm dialog.
 */
test("A can change a question's category before sharing, and an existing answer survives it", async ({
  page,
}) => {
  await startDraft(page);
  await addChoiceQuestion(page, {
    text: "Ideal weekend?",
    options: ["Stay in", "Go out"],
    category: "Relationship",
  });

  const card = questionCard(page, "Ideal weekend?");
  await answerChoice(card, "Stay in");

  await card.getByLabel("Category").selectOption({ label: "Money" });
  await expect(card.getByLabel("Category")).toHaveValue("money");

  // A category-only change never touches text/options, so the DB trigger
  // that invalidates answers (which only watches text/options) has nothing
  // to do here — the existing answer must still be selected and saved.
  await expect(card.getByRole("radio", { name: "Stay in" })).toBeChecked();

  // Persists across a fresh server render, not just client state.
  await page.reload();
  await expect(questionCard(page, "Ideal weekend?").getByLabel("Category")).toHaveValue("money");
  await expect(
    questionCard(page, "Ideal weekend?").getByRole("radio", { name: "Stay in" }),
  ).toBeChecked();
});

/**
 * Regression test for a follow-up bug report: changing category, then
 * later editing the question's text, must both work — the text edit must
 * still clear the existing answer. This is the exact sequence (category
 * edit, then a separate text edit on the same question) manual QA
 * exercised; question-edit-form.tsx's category `<select>` now remounts
 * after every completed submission (see its own doc comment) specifically
 * so a category edit never leaves a stale value behind to interfere with a
 * later, unrelated edit bundled into the same one-`<form>` UPDATE.
 */
test("changing category, then separately editing text, both succeed and text still clears the answer", async ({
  page,
}) => {
  await startDraft(page);
  await addChoiceQuestion(page, {
    text: "Ideal weekend?",
    options: ["Stay in", "Go out"],
    category: "Relationship",
  });

  const card = questionCard(page, "Ideal weekend?");
  await answerChoice(card, "Stay in");

  await card.getByLabel("Category").selectOption({ label: "Money" });
  await expect(card.getByLabel("Category")).toHaveValue("money");
  await expect(card.getByRole("radio", { name: "Stay in" })).toBeChecked();

  // Separately, edit the text — must succeed (no "Something went wrong")
  // and must clear the now-invalid answer.
  await card.getByLabel("Question text").fill("Ideal weekend plans?");
  await card.getByLabel("Question text").press("Tab");

  const editedCard = questionCard(page, "Ideal weekend plans?");
  await expect(editedCard.getByRole("alert")).toHaveCount(0);
  await expect(editedCard.getByRole("radio", { name: "Stay in" })).not.toBeChecked();
  await expect(answerSavedStatus(editedCard)).not.toBeVisible();
  await expect(editedCard.getByLabel("Category")).toHaveValue("money");
});
