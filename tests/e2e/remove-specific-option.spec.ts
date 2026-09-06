import { expect, test } from "@playwright/test";

import { addChoiceQuestion, answerChoice, questionCard, startDraft } from "./utils/wavelength";

/**
 * E2E #2 — QA bug: "Remove option" always removes the LAST option field,
 * not whichever one the user actually meant to remove. The UI offers no
 * per-option delete affordance today (components/questionnaire/
 * question-edit-form.tsx has a single, blind "Remove option" button that
 * just shrinks the rendered option count by one) — so this test does the
 * only thing a real user can do: fill N options, click the one "Remove
 * option" button once, and check which option actually survived.
 *
 * Asserts the DESIRED outcome (removing a specific, non-last option leaves
 * every other one — including later ones — untouched). Expected to FAIL
 * today: the actual remaining set will be [Alpha, Beta, Gamma] (Delta
 * dropped) instead of the intended [Alpha, Gamma, Delta] (Beta dropped).
 * Do not adjust the assertion to match that — this is the bug to fix later.
 */
test("removing a non-last option removes that option, not the last one", async ({ page }) => {
  await startDraft(page);
  await addChoiceQuestion(page, {
    text: "Favorite season?",
    options: ["Alpha", "Beta", "Gamma", "Delta"],
  });

  const card = questionCard(page, "Favorite season?");
  const optionInputs = card.locator('input[name="options"]');
  await expect(optionInputs).toHaveCount(4);

  // The only removal control available: one "Remove option" button, no way
  // to target which field. The user's intent here is "remove Beta".
  await card.getByRole("button", { name: "Remove option" }).click();

  await expect(optionInputs).toHaveCount(3);
  const remaining = await optionInputs.evaluateAll((inputs) =>
    inputs.map((el) => (el as HTMLInputElement).value),
  );

  // Desired: Beta specifically is gone, Alpha/Gamma/Delta remain in order.
  expect(remaining).toEqual(["Alpha", "Gamma", "Delta"]);

  // Whatever the surviving set turns out to be, the question must still
  // work normally afterward — this part is expected to pass regardless of
  // the bug above.
  const survivingOptionText = remaining[0]!;
  await answerChoice(card, survivingOptionText);
});
