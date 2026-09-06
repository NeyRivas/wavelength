import { expect, test } from "@playwright/test";

import { addChoiceQuestion, answerChoice, questionCard, startDraft } from "./utils/wavelength";

/**
 * E2E #4 — QA fix: "Remove option" now has one control per option (aria-
 * label "Remove option N"), each targeting exactly that option regardless
 * of position — the old single, blind "Remove option" button always
 * dropped whichever field happened to be rendered last, no matter which one
 * the user meant. Removing also invalidates any existing answer for the
 * question (same rule as edit-after-answer.spec.ts), verified below too.
 */
test("removing a specific (non-last) option removes exactly that one, in order", async ({
  page,
}) => {
  await startDraft(page);
  await addChoiceQuestion(page, {
    text: "Favorite season?",
    options: ["Alpha", "Beta", "Gamma", "Delta"],
  });

  const card = questionCard(page, "Favorite season?");
  const optionInputs = card.locator('input[name="options"]');
  await expect(optionInputs).toHaveCount(4);
  await answerChoice(card, "Beta");

  // Target "Beta" specifically (its own button, not the last one).
  await card.getByRole("button", { name: "Remove option 2" }).click();

  await expect(optionInputs).toHaveCount(3);
  const remaining = await optionInputs.evaluateAll((inputs) =>
    inputs.map((el) => (el as HTMLInputElement).value),
  );
  expect(remaining).toEqual(["Alpha", "Gamma", "Delta"]);

  // Removing an option is a structural change — the prior answer ("Beta",
  // now gone) must be invalidated, not silently left dangling.
  await expect(card.getByText("Saved", { exact: true })).not.toBeVisible();
  await answerChoice(card, "Gamma");
});

test("removing the first option leaves the rest, in order, and the question stays usable", async ({
  page,
}) => {
  await startDraft(page);
  await addChoiceQuestion(page, {
    text: "Favorite drink?",
    options: ["Coffee", "Tea", "Juice"],
  });

  const card = questionCard(page, "Favorite drink?");
  const optionInputs = card.locator('input[name="options"]');

  await card.getByRole("button", { name: "Remove option 1" }).click();

  await expect(optionInputs).toHaveCount(2);
  const remaining = await optionInputs.evaluateAll((inputs) =>
    inputs.map((el) => (el as HTMLInputElement).value),
  );
  expect(remaining).toEqual(["Tea", "Juice"]);

  await answerChoice(card, "Tea");
});
