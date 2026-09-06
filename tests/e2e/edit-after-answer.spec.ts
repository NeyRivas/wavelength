import { expect, test } from "@playwright/test";

import {
  addChoiceQuestion,
  addScaleQuestion,
  answerChoice,
  answerSavedStatus,
  answerScale,
  editForm,
  questionCard,
  startDraft,
} from "./utils/wavelength";

/**
 * E2E #1/#2/#3 — QA round 2 fix: editing a question's text, editing an
 * option's text, or adding an option after A has already answered it
 * invalidates the existing answer, and — this is what round 2 actually
 * fixed — the UI now visibly reflects that (the radio really unchecks in
 * the browser), not just the database. Root cause: AnswerControl's radios
 * are uncontrolled (`defaultChecked`, applied once at mount); QuestionCard
 * now keys `<AnswerControl>` by `[question.text, question.options]` so it
 * fully remounts — picking up the freshly-revalidated (now-cleared) answer
 * — exactly when, and only when, the question was actually edited. See
 * tests/integration/answer-invalidation.test.ts for the same invalidation
 * rule proven directly at the DB layer.
 */

test("editing a Choice question's text invalidates A's existing answer", async ({ page }) => {
  await startDraft(page);
  await addChoiceQuestion(page, { text: "Ideal weekend?", options: ["Stay in", "Go out"] });

  const card = questionCard(page, "Ideal weekend?");
  await answerChoice(card, "Stay in");

  await card.getByLabel("Question text").fill("Ideal weekend plans?");
  await card.getByLabel("Question text").press("Tab"); // triggers the blur-based auto-save

  const editedCard = questionCard(page, "Ideal weekend plans?");
  await expect(editedCard.getByRole("radio", { name: "Stay in" })).not.toBeChecked();
  await expect(answerSavedStatus(editedCard)).not.toBeVisible();

  // The new answer can still be selected and auto-saves normally.
  await answerChoice(editedCard, "Go out");
});

test("editing a Choice question's option text invalidates A's existing answer", async ({
  page,
}) => {
  await startDraft(page);
  await addChoiceQuestion(page, { text: "Ideal weekend?", options: ["Stay in", "Go out"] });

  const card = questionCard(page, "Ideal weekend?");
  await answerChoice(card, "Stay in");

  const firstOption = card.locator('input[name="options"]').first();
  await firstOption.fill("Stay home");
  await firstOption.press("Tab");

  await expect(card.getByRole("radio", { name: "Stay home" })).not.toBeChecked();
  await expect(answerSavedStatus(card)).not.toBeVisible();

  await answerChoice(card, "Go out");
});

test("adding an option to a Choice question invalidates A's existing answer", async ({ page }) => {
  await startDraft(page);
  await addChoiceQuestion(page, { text: "Ideal weekend?", options: ["Stay in", "Go out"] });

  const card = questionCard(page, "Ideal weekend?");
  await answerChoice(card, "Stay in");

  const optionInputs = card.locator('input[name="options"]');
  await card.getByRole("button", { name: "Add option" }).click();
  await expect(optionInputs).toHaveCount(3);
  // The new, empty option field needs a value before the form (all
  // `options` inputs are `required`) can actually save — same as a real
  // user filling in what they just added.
  await optionInputs.nth(2).fill("Stay in and go out");
  await optionInputs.nth(2).press("Tab");

  await expect(card.getByRole("radio", { name: "Stay in" })).not.toBeChecked();
  await expect(answerSavedStatus(card)).not.toBeVisible();

  await answerChoice(card, "Go out");
});

test("editing a Scale question's text invalidates A's existing answer", async ({ page }) => {
  await startDraft(page);
  await addScaleQuestion(page, { text: "Importance of routine" });

  const card = questionCard(page, "Importance of routine");
  await answerScale(card, "Moderadamente importante");

  await card.getByLabel("Question text").fill("Importance of daily routine");
  await card.getByLabel("Question text").press("Tab");

  const editedCard = questionCard(page, "Importance of daily routine");
  await expect(
    editedCard.getByRole("radio", { name: "Moderadamente importante" }),
  ).not.toBeChecked();
  await expect(answerSavedStatus(editedCard)).not.toBeVisible();

  await answerScale(editedCard, "Muy importante");
});

test("Test H: changing the answer directly (no question/option edit) never triggers invalidation", async ({
  page,
}) => {
  await startDraft(page);
  await addChoiceQuestion(page, { text: "Ideal weekend?", options: ["Stay in", "Go out"] });

  const card = questionCard(page, "Ideal weekend?");
  await answerChoice(card, "Stay in");

  // A plain re-answer — the key fix (question-card.tsx) is keyed by
  // question text/options, which this never touches, so AnswerControl must
  // NOT remount here: the new selection just replaces the old one normally.
  await answerChoice(card, "Go out");
  await expect(card.getByRole("radio", { name: "Go out" })).toBeChecked();
  await expect(card.getByRole("radio", { name: "Stay in" })).not.toBeChecked();
});

test("Tests I/J: a newly-added option's own blur actually auto-saves and shows Saved, and survives a reload", async ({
  page,
}) => {
  await startDraft(page);
  await addChoiceQuestion(page, { text: "Ideal weekend?", options: ["Stay in", "Go out"] });

  const card = questionCard(page, "Ideal weekend?");
  const optionInputs = card.locator('input[name="options"]');

  await card.getByRole("button", { name: "Add option" }).click();
  await expect(optionInputs).toHaveCount(3);
  await optionInputs.nth(2).fill("Stay in and go out");
  await optionInputs.nth(2).press("Tab");

  // QuestionEditForm's own "Saved" (distinct from AnswerControl's) confirms
  // the blur-triggered save actually completed — not just that the typed
  // text still looks right in an untouched, uncontrolled input.
  await expect(editForm(card).getByText("Saved", { exact: true })).toBeVisible();

  await page.reload();
  const reloadedInputs = questionCard(page, "Ideal weekend?").locator('input[name="options"]');
  await expect(reloadedInputs).toHaveCount(3);
  await expect(reloadedInputs.nth(2)).toHaveValue("Stay in and go out");
});
