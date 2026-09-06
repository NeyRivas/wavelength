import { expect, test } from "@playwright/test";

import {
  addChoiceQuestion,
  answerChoice,
  finalizeDraft,
  questionCard,
  startDraft,
} from "./utils/wavelength";

/**
 * E2E #6 — QA fix: A previously had no way to see their own
 * questions/answers again once the questionnaire was locked (finalized) —
 * the "Your Wavelength" page only showed the share link and B's status.
 * app/w/[token]/page.tsx now also renders a read-only summary
 * (components/questionnaire/read-only-answers.tsx) for A in that state:
 * every question and A's own formatted answer, with no way to edit
 * anything — no question-text input, no option inputs, no answer radios,
 * no add/remove-option controls. This must not touch the existing
 * share-link / B-status UI (ShareView) it renders alongside.
 */

const QUESTIONS = [
  { text: "Question one", options: ["A1", "A2"] },
  { text: "Question two", options: ["A1", "A2"] },
  { text: "Question three", options: ["A1", "A2"] },
  { text: "Question four", options: ["A1", "A2"] },
  { text: "Question five", options: ["A1", "A2"] },
];

test("A sees a read-only view of their questions and answers after finalizing, with no edit controls", async ({
  page,
}) => {
  await startDraft(page);
  for (const q of QUESTIONS) {
    await addChoiceQuestion(page, q);
    await answerChoice(questionCard(page, q.text), q.options[0]!);
  }
  await finalizeDraft(page, "Alex");

  // Already on "Your Wavelength" (finalizeDraft waits for that heading) —
  // the share link/status UI must still be there, untouched.
  await expect(page.locator("#share-link")).toBeVisible();

  // The new read-only summary: every question's text and its formatted
  // answer are visible.
  await expect(page.getByRole("heading", { name: "Your questions and answers" })).toBeVisible();
  for (const q of QUESTIONS) {
    await expect(page.getByText(q.text, { exact: true })).toBeVisible();
  }
  await expect(page.getByText(QUESTIONS[0]!.options[0]!, { exact: true }).first()).toBeVisible();

  // No edit affordance survives into this view: no editable question-text
  // field, no option inputs, no answer radios, no add/remove-option
  // buttons — this is read-only by construction, not just visually.
  await expect(page.getByLabel("Question text")).toHaveCount(0);
  await expect(page.locator('input[name="options"]')).toHaveCount(0);
  await expect(page.getByRole("radio")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Add option" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Remove option/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);

  // Reloading (a fresh server render, not just client state) shows the same
  // thing — this isn't a one-time client-side artifact of finalizing.
  await page.reload();
  await expect(page.getByRole("heading", { name: "Your questions and answers" })).toBeVisible();
  await expect(page.getByText(QUESTIONS[0]!.text, { exact: true })).toBeVisible();
});
