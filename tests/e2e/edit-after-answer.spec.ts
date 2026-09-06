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
 * E2E #1 — QA bug: editing a question's text/options after A has already
 * answered it does not invalidate the existing answer. The audit
 * ("tests/e2e — auditoría") found zero coverage of this interaction at any
 * level (unit, integration): question-editing.test.ts never touches
 * `answers`, and answers-privacy.test.ts never edits `questions` mid-test.
 *
 * This spec asserts the DESIRED behavior (edit invalidates the prior
 * answer, A must answer again) — it is expected to FAIL against the
 * current implementation, which has no such invalidation logic anywhere
 * (updateQuestion in app/actions/questions.ts never touches `answers`).
 * Do not "fix" the assertions to match current behavior — the point of
 * this test, for now, is to document the gap so it goes green once the
 * behavior is actually implemented.
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
