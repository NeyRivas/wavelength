import { expect, test } from "@playwright/test";

import {
  addChoiceQuestion,
  addScaleQuestion,
  answerChoice,
  answerScale,
  questionCard,
  startDraft,
} from "./utils/wavelength";

/**
 * E2E #1/#2/#3 — QA fix: editing a question's text, editing an option's
 * text, or adding an option after A has already answered it invalidates the
 * existing answer (questions_invalidate_answers_on_edit DB trigger; see
 * tests/integration/answer-invalidation.test.ts for the same rule exercised
 * directly at the DB layer). A must then answer again, and the normal
 * auto-save flow works exactly as before for that new selection.
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
  await expect(editedCard.getByText("Saved", { exact: true })).not.toBeVisible();

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
  await expect(card.getByText("Saved", { exact: true })).not.toBeVisible();

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
  await expect(card.getByText("Saved", { exact: true })).not.toBeVisible();

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
  await expect(editedCard.getByText("Saved", { exact: true })).not.toBeVisible();

  await answerScale(editedCard, "Muy importante");
});
