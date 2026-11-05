import { expect, test } from "@playwright/test";

import {
  answerChoice,
  answerRadio,
  editAndBlur,
  editForm,
  optionInputs as optionInputsOf,
  questionCard,
} from "./utils/wavelength";

/**
 * Regression guard for a bug found in QA on both Friends ready-made games
 * ("How Well Do You Know Me?", "Friendship Check"): A types real option
 * text into an empty (UNWRITTEN_OPTION-seeded) answer-option field, the
 * field auto-saves on blur (components/questionnaire/question-edit-form.tsx),
 * and the save genuinely succeeds (the new text shows up correctly in
 * "Your answer" and persists in the DB) — but the *editable option field
 * itself* visually reverted back to blank once the save settled, even
 * though nothing was actually lost. Trying to save anything else on that
 * same question afterward then failed, because the browser's own
 * `required` validation saw an empty field.
 *
 * Root cause: the option `<input>` was *uncontrolled* (`defaultValue`,
 * set once at this component's first mount). React's own `<form
 * action={...}>` handling (used here via `useActionState`) resets every
 * uncontrolled field in that form back to its `defaultValue` once the
 * form's action settles — by design, mirroring what a plain HTML form
 * reset does after a real submit. Since `defaultValue` was computed once
 * at mount (often "" for a still-unwritten ready-made question), every
 * save silently wiped the field back to that stale, empty value. The fix
 * (question-edit-form.tsx) makes the field *controlled* (`value` +
 * `onChange`), which React itself keeps authoritative across that reset.
 *
 * This test starts from a Friends ready-made game (where every question
 * already has real, approved text and only the *options* are unwritten),
 * which is exactly where this bug was actually found. Ready-made games now
 * open in the guided quiz, so this goes through "Customize questions" to
 * reach the builder that owns this form.
 *
 * The checks after the save run only once it has answered *and* the form
 * has settled (editAndBlur) — the moment the old bug reset the fields —
 * rather than after "Saved", which QuestionEditForm shows whenever it
 * isn't saving and so could be seen before the save even started.
 */
test("a typed answer option survives its own auto-save, without a reload, and 'Your answer' keeps working", async ({
  page,
}) => {
  await page.goto("/play/friends/how-well-do-you-know-me");
  await page
    .getByRole("button", { name: /Make your quiz/ })
    .first()
    .click();
  await page.getByRole("link", { name: "Customize questions" }).click();

  const firstQuestionText = "What's a song that will instantly make me think of a specific memory?";
  const card = questionCard(page, firstQuestionText);
  await expect(card).toBeVisible();

  const optionInputs = optionInputsOf(card);
  await expect(optionInputs).toHaveCount(2);

  // Both start genuinely blank (the UNWRITTEN_OPTION sentinel renders as
  // an empty, placeholder-hinted field, not visible text).
  await expect(optionInputs.nth(0)).toHaveValue("");
  await expect(optionInputs.nth(1)).toHaveValue("");

  // Every option field is `required`, so leaving the first one while the
  // second is still blank saves nothing yet (the browser's own validation
  // stops the submit) — and must not lose what was typed either.
  await optionInputs.nth(0).fill("Pizza");
  await optionInputs.nth(0).blur();
  await expect(optionInputs.nth(0)).toHaveValue("Pizza");

  // With both filled in, leaving the field saves, and editAndBlur waits for
  // that save to answer and the form to settle.
  await editAndBlur(page, optionInputs.nth(1), "Sushi");
  await expect(editForm(card).getByText("Saved", { exact: true })).toBeVisible();

  // Both fields still show exactly what was typed — nothing reverted,
  // nothing lost — matching the single source of truth "Your answer"
  // (below) already reads from.
  await expect(optionInputs.nth(0)).toHaveValue("Pizza");
  await expect(optionInputs.nth(1)).toHaveValue("Sushi");

  // "Your answer" — completely unmodified by this fix — must still show
  // both options and let A pick the correct one (by clicking its pill, as
  // a person does; answerChoice waits for that answer's own save).
  await expect(answerRadio(card, "Pizza")).toBeAttached();
  await expect(answerRadio(card, "Sushi")).toBeAttached();
  await answerChoice(card, "Pizza");
  await expect(answerRadio(card, "Pizza")).toBeChecked();
  await expect(answerRadio(card, "Sushi")).not.toBeChecked();

  // The option fields are still correct after answering too — selecting
  // an answer is a separate save (saveAnswerA) that must not disturb them.
  await expect(optionInputs.nth(0)).toHaveValue("Pizza");
  await expect(optionInputs.nth(1)).toHaveValue("Sushi");
});
