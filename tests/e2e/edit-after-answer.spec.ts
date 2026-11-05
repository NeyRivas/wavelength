import { expect, test } from "@playwright/test";

import {
  addChoiceQuestion,
  addScaleQuestion,
  answerChoice,
  answerRadio,
  answerSavedStatus,
  answerScale,
  editAndBlur,
  editForm,
  optionInputs as optionInputsOf,
  questionCard,
  questionTextField,
  startDraft,
} from "./utils/wavelength";

/**
 * E2E #1/#2/#3 — editing a question's text, or editing the text of the
 * option A picked, after A has already answered it invalidates the
 * existing answer, and the UI must visibly reflect that (the radio really
 * unchecks, and AnswerControl's own "Saved" goes away too), not just the
 * database. Adding an option doesn't (see that test's own note).
 *
 * Round 2 fix: AnswerControl's radios are uncontrolled (`defaultChecked`,
 * applied once at mount); QuestionCard keys `<AnswerControl>` by
 * `[question.text, question.options]` so it fully remounts — picking up
 * the freshly-revalidated (now-cleared) answer — exactly when the question
 * was actually edited.
 *
 * Round 3 fix (the part every `answerSavedStatus(...)).not.toBeVisible()`
 * assertion below specifically catches): the round-2 key alone wasn't
 * enough, because the *props feeding it* weren't actually refreshing.
 * QuestionEditForm and AnswerControl are two independent client-component
 * islands, each with its own `useActionState`; updateQuestion's own
 * `revalidatePath("/create")` wasn't reliably reaching the sibling
 * AnswerControl island in the real browser (confirmed by manual QA:
 * AnswerControl kept showing "Saved" — i.e. `currentValue` was still
 * defined — even though the question text/options had genuinely changed).
 * question-edit-form.tsx now calls `router.refresh()` after every
 * successful save, which is what actually delivers the fresh
 * `question`/`currentValue` props the round-2 key depends on.
 *
 * See tests/integration/answer-invalidation.test.ts for the same
 * invalidation rule proven directly at the DB layer — that was never the
 * broken part; this file is what actually exercises the browser.
 */

test("editing a Choice question's text invalidates A's existing answer", async ({ page }) => {
  await startDraft(page);
  await addChoiceQuestion(page, { text: "Ideal weekend?", options: ["Stay in", "Go out"] });

  const card = questionCard(page, "Ideal weekend?");
  await answerChoice(card, "Stay in");

  // Leaving the field triggers the blur-based auto-save; editAndBlur waits
  // for that save to answer.
  await editAndBlur(page, questionTextField(card), "Ideal weekend plans?");

  const editedCard = questionCard(page, "Ideal weekend plans?");
  await expect(answerRadio(editedCard, "Stay in")).not.toBeChecked();
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

  await editAndBlur(page, optionInputsOf(card).first(), "Stay home");

  await expect(answerRadio(card, "Stay home")).not.toBeChecked();
  await expect(answerSavedStatus(card)).not.toBeVisible();

  await answerChoice(card, "Go out");
});

/**
 * Product requirement (supabase/migrations/20260910120000_refine_answer_
 * invalidation.sql): an options change only clears an answer whose
 * selected option no longer exists. Adding a new option leaves the
 * selected one in place, so the answer must survive — visibly, and after a
 * reload — and the question must stay answerable with the new option.
 */
test("adding an option to a Choice question keeps A's existing answer", async ({ page }) => {
  await startDraft(page);
  await addChoiceQuestion(page, { text: "Ideal weekend?", options: ["Stay in", "Go out"] });

  const card = questionCard(page, "Ideal weekend?");
  await answerChoice(card, "Stay in");

  const optionInputs = optionInputsOf(card);
  await card.getByRole("button", { name: "+ Add option" }).click();
  await expect(optionInputs).toHaveCount(3);
  // The new, empty option field needs a value before the form (all
  // `options` inputs are `required`) can actually save — same as a real
  // user filling in what they just added.
  await editAndBlur(page, optionInputs.nth(2), "Stay in and go out");

  await expect(answerRadio(card, "Stay in and go out")).toBeAttached();
  await expect(answerRadio(card, "Stay in")).toBeChecked();
  await expect(answerSavedStatus(card)).toBeVisible();

  await page.reload();
  const reloadedCard = questionCard(page, "Ideal weekend?");
  await expect(answerRadio(reloadedCard, "Stay in")).toBeChecked();
  await expect(optionInputsOf(reloadedCard)).toHaveCount(3);

  await answerChoice(reloadedCard, "Stay in and go out");
  await expect(answerRadio(reloadedCard, "Stay in")).not.toBeChecked();
});

test("editing a Scale question's text invalidates A's existing answer", async ({ page }) => {
  await startDraft(page);
  await addScaleQuestion(page, { text: "Importance of routine" });

  const card = questionCard(page, "Importance of routine");
  await answerScale(card, "Moderately important");

  await editAndBlur(page, questionTextField(card), "Importance of daily routine");

  const editedCard = questionCard(page, "Importance of daily routine");
  await expect(answerRadio(editedCard, "Moderately important")).not.toBeChecked();
  await expect(answerSavedStatus(editedCard)).not.toBeVisible();

  await answerScale(editedCard, "Very important");
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
  await expect(answerRadio(card, "Go out")).toBeChecked();
  await expect(answerRadio(card, "Stay in")).not.toBeChecked();
});

test("Tests I/J: a newly-added option's own blur actually auto-saves and shows Saved, and survives a reload", async ({
  page,
}) => {
  await startDraft(page);
  await addChoiceQuestion(page, { text: "Ideal weekend?", options: ["Stay in", "Go out"] });

  const card = questionCard(page, "Ideal weekend?");
  const optionInputs = optionInputsOf(card);

  await card.getByRole("button", { name: "+ Add option" }).click();
  await expect(optionInputs).toHaveCount(3);
  // editAndBlur waits for the blur-triggered save's own response, which is
  // what proves the save ran: QuestionEditForm's "Saved" (checked after it)
  // reads "Saved" whenever it isn't saving, so on its own it proves nothing.
  await editAndBlur(page, optionInputs.nth(2), "Stay in and go out");
  await expect(editForm(card).getByText("Saved", { exact: true })).toBeVisible();

  await page.reload();
  const reloadedInputs = questionCard(page, "Ideal weekend?").locator('input[name="options"]');
  await expect(reloadedInputs).toHaveCount(3);
  await expect(reloadedInputs.nth(2)).toHaveValue("Stay in and go out");
});
