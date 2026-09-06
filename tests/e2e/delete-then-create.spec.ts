import { expect, test } from "@playwright/test";

import { addChoiceQuestion, questionCard, startDraft } from "./utils/wavelength";

/**
 * E2E #3 — QA bug (priority: high): deleting a question and then
 * immediately creating a new one can leave the questionnaire "laggeado" —
 * unable to create the new question, even after a reload.
 *
 * Audit finding, for context (not a fix, just why this is worth writing up
 * carefully): `addQuestion` (app/actions/questions.ts) computes the new
 * row's `order_index` from `count(*) of questions for this wavelength`.
 * `deleteQuestion` never renumbers the remaining rows' `order_index`, so a
 * mid-list delete leaves a *gap* rather than shifting things down. The next
 * `count(*)` is one lower than before, but it collides with a
 * `order_index` value that still belongs to an existing row —
 * `questions_order_unique (wavelength_id, order_index)` then rejects the
 * insert, surfacing as the generic "Something went wrong" error and
 * leaving A stuck (a reload doesn't help, because the *data* is in a state
 * that reproduces the same collision every time, not a client-side glitch
 * that would clear on refresh).
 *
 * This test does not assert *why* it fails — only that creating a question
 * right after deleting a middle one must succeed, and must still be
 * correct after a reload. Expected to FAIL today.
 */
test("deleting a middle question, then creating a new one, works — including after reload", async ({
  page,
}) => {
  await startDraft(page);
  await addChoiceQuestion(page, { text: "Question one", options: ["A", "B"] });
  await addChoiceQuestion(page, { text: "Question two", options: ["A", "B"] });
  await addChoiceQuestion(page, { text: "Question three", options: ["A", "B"] });

  // Delete the middle one — the specific sequence the bug report describes.
  await questionCard(page, "Question two").getByRole("button", { name: "Delete" }).click();
  await expect(questionCard(page, "Question two")).toHaveCount(0);

  // Immediately try to create a new question.
  await addChoiceQuestion(page, { text: "Question four", options: ["A", "B"] });
  await expect(questionCard(page, "Question four")).toBeVisible();

  // Reload and confirm the state is exactly right: the deleted one stays
  // gone, the other three are present, and nothing is stuck — creating yet
  // another question afterward still works normally.
  await page.reload();
  await expect(questionCard(page, "Question one")).toBeVisible();
  await expect(questionCard(page, "Question two")).toHaveCount(0);
  await expect(questionCard(page, "Question three")).toBeVisible();
  await expect(questionCard(page, "Question four")).toBeVisible();

  await addChoiceQuestion(page, { text: "Question five", options: ["A", "B"] });
  await expect(questionCard(page, "Question five")).toBeVisible();
});
