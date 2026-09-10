import { expect, test } from "@playwright/test";

import { addChoiceQuestion, answerChoice, questionCard, startDraft } from "./utils/wavelength";

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
