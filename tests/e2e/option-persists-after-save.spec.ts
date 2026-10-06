import { expect, test } from "@playwright/test";

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
 * This file is deliberately NOT using tests/e2e/utils/wavelength.ts's
 * `addChoiceQuestion`/`addQuestionForm` helpers, since those target an
 * older `<select>`-based Category/Type add-question form that predates
 * the current pill-based QuestionAddForm — this test instead starts from
 * a Friends ready-made game (where every question already has real,
 * approved text and only the *options* are unwritten), which is also
 * exactly where this bug was actually found.
 */
test("a typed answer option survives its own auto-save, without a reload, and 'Your answer' keeps working", async ({
  page,
}) => {
  await page.goto("/play/friends");
  await page.getByRole("button", { name: /How Well Do You Know Me\?/ }).click();

  const firstQuestionText = "What's a song that will instantly make me think of a specific memory?";
  const card = page.getByRole("article", { name: `Question: ${firstQuestionText}` });
  await expect(card).toBeVisible();

  const optionInputs = card.locator('input[name="options"]');
  await expect(optionInputs).toHaveCount(2);

  // Both start genuinely blank (the UNWRITTEN_OPTION sentinel renders as
  // an empty, placeholder-hinted field, not visible text).
  await expect(optionInputs.nth(0)).toHaveValue("");
  await expect(optionInputs.nth(1)).toHaveValue("");

  await optionInputs.nth(0).fill("Pizza");
  await optionInputs.nth(0).blur();

  // QuestionEditForm's own save status, scoped to the form that actually
  // owns the options fieldset (not AnswerControl's identically-worded
  // "Saved", a sibling form under the same card).
  const editForm = optionInputs.first().locator("xpath=ancestor::form[1]");
  await expect(editForm.getByText("Saved", { exact: true })).toBeVisible();

  // The bug: right after that save settles, the field the user just typed
  // into reverted to blank even though the save genuinely succeeded.
  await expect(optionInputs.nth(0)).toHaveValue("Pizza");

  await optionInputs.nth(1).fill("Sushi");
  await optionInputs.nth(1).blur();
  await expect(editForm.getByText("Saved", { exact: true })).toBeVisible();

  // Both fields still show exactly what was typed — nothing reverted,
  // nothing lost — matching the single source of truth "Your answer"
  // (below) already reads from.
  await expect(optionInputs.nth(0)).toHaveValue("Pizza");
  await expect(optionInputs.nth(1)).toHaveValue("Sushi");

  // "Your answer" — completely unmodified by this fix — must still show
  // both options and let A pick the correct one.
  const answerFieldset = card.getByRole("group", { name: "Your answer" });
  await expect(answerFieldset.getByRole("radio", { name: "Pizza" })).toBeVisible();
  await expect(answerFieldset.getByRole("radio", { name: "Sushi" })).toBeVisible();
  await answerFieldset.getByRole("radio", { name: "Pizza" }).check();
  await expect(answerFieldset.getByRole("radio", { name: "Pizza" })).toBeChecked();

  // The option fields are still correct after answering too — selecting
  // an answer is a separate save (saveAnswerA) that must not disturb them.
  await expect(optionInputs.nth(0)).toHaveValue("Pizza");
  await expect(optionInputs.nth(1)).toHaveValue("Sushi");
});
