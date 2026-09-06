import { expect, test } from "@playwright/test";

import { addChoiceQuestion, questionCard, startDraft } from "./utils/wavelength";

/**
 * E2E #5 — QA fix: deleting a question and then immediately creating a new
 * one used to leave the questionnaire stuck — the new question would be
 * rejected with "You already have a question with this text.", even with
 * completely different text, and persisting after reload.
 *
 * Root cause (see app/actions/questions.ts's addQuestion and
 * tests/integration/questions-authorization.test.ts's "delete then create"
 * suite for the DB-layer proof): the next question's `order_index` used to
 * be computed from `count(*)`, which isn't gap-safe once a mid-list delete
 * leaves a gap (deleting never renumbers survivors) — the resulting
 * `order_index` collision was mislabeled as a duplicate-text error by the
 * old, imprecise unique-violation check. Fixed by computing the next index
 * from `MAX(order_index) + 1` (always gap-safe) and by distinguishing which
 * unique constraint actually fired before blaming duplicate text.
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
