import { expect, test } from "@playwright/test";

import { getReadyMadeGame } from "../../lib/wavelength/ready-made-games";
import { answerQuizChoice, quizQuestion } from "./utils/wavelength";

/**
 * Two navigation/UX fixes to the guided quiz (components/quiz/quiz-stepper.tsx)
 * and the builder it hands off to (app/create/page.tsx), exercised end to
 * end in a real browser:
 *
 * 1. "Review your answers" used to jump back to question 1 and make A step
 *    through every question again to see them all. It now opens one screen
 *    with every question and its saved answer, and editing one from there
 *    returns to review instead of resuming the normal Next/Previous
 *    sequence (see tests/unit/quiz-stepper.test.ts for the full
 *    question-level coverage of that round trip).
 * 2. "Customize questions" opened the builder with no memory of which
 *    question A was on; its own "Back to the quiz" link always resumed at
 *    the first unanswered question. It now carries the current question's
 *    id in a `returnTo` query param, which the builder's "Back to the
 *    quiz" link forwards straight back to app/create's quiz view.
 *
 * Needs the real Supabase Anonymous Auth backend (see playwright.config.ts)
 * — not runnable in a sandbox without one.
 */

const GAME_ID = "how-well-do-you-know-each-other";
const QUESTIONS = getReadyMadeGame(GAME_ID)!.questions!;

function answerFor(index: number): string {
  const question = QUESTIONS[index]!;
  return question.type === "scale" ? "Very important" : question.options![0]!;
}

test("Review your answers shows every question at once, and editing one returns to review", async ({
  page,
}) => {
  await page.goto(`/create?game=${GAME_ID}`);
  await page.getByRole("button", { name: "Start the quiz" }).click();

  for (let i = 0; i < QUESTIONS.length; i++) {
    await answerQuizChoice(page, QUESTIONS[i]!.text, answerFor(i));
  }
  await expect(page.getByRole("heading", { name: "That's every question" })).toBeVisible();

  await page.getByRole("button", { name: "Review your answers" }).click();
  await expect(page.getByRole("heading", { name: "Review your answers" })).toBeVisible();
  // Every question is on screen together — no Next/Previous needed to see
  // the rest of them.
  for (const question of QUESTIONS) {
    await expect(page.getByText(question.text)).toBeVisible();
  }
  await expect(page.getByRole("button", { name: "Next" })).toHaveCount(0);

  // Change the second question's answer from the review screen.
  const secondCard = page.locator(".create-card", { has: page.getByText(QUESTIONS[1]!.text) });
  await secondCard.getByRole("button", { name: "Change answer" }).click();
  await expect(quizQuestion(page, QUESTIONS[1]!.text)).toBeVisible();
  // Labeled as a detour, not the normal sequential controls.
  await expect(page.getByRole("button", { name: "Back to review" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save & return to review" })).toBeVisible();

  const newAnswer = QUESTIONS[1]!.type === "scale" ? "Not important" : QUESTIONS[1]!.options![1]!;
  await quizQuestion(page, QUESTIONS[1]!.text)
    .getByRole("button", { name: newAnswer, exact: true })
    .click();

  // Back on review — not the next question — with the new answer showing.
  await expect(page.getByRole("heading", { name: "Review your answers" })).toBeVisible();
  const updatedCard = page.locator(".create-card", { has: page.getByText(QUESTIONS[1]!.text) });
  await expect(updatedCard.getByText(newAnswer)).toBeVisible();
  // The other answers were untouched by that round trip.
  for (let i = 0; i < QUESTIONS.length; i++) {
    if (i === 1) continue;
    const card = page.locator(".create-card", { has: page.getByText(QUESTIONS[i]!.text) });
    await expect(card.getByText(answerFor(i), { exact: true })).toBeVisible();
  }

  // Back on the review screen itself returns to the completion screen it
  // was opened from, not question 1.
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByRole("heading", { name: "That's every question" })).toBeVisible();
});

test("Customize questions remembers the exact question, and Back returns to it", async ({
  page,
}) => {
  await page.goto(`/create?game=${GAME_ID}`);
  await page.getByRole("button", { name: "Start the quiz" }).click();

  // Answer the first two questions, landing on the third.
  await answerQuizChoice(page, QUESTIONS[0]!.text, answerFor(0));
  await answerQuizChoice(page, QUESTIONS[1]!.text, answerFor(1));
  await expect(quizQuestion(page, QUESTIONS[2]!.text)).toBeVisible();

  await page.getByRole("link", { name: "Customize questions" }).click();
  // The builder's own "Back to the quiz" link only renders in edit mode —
  // its presence confirms we actually left the quiz for the editor.
  const backToQuiz = page.getByRole("link", { name: "Back to the quiz" });
  await expect(backToQuiz).toBeVisible();

  await backToQuiz.click();
  // Resumes on question 3 — not question 1, not the first unanswered one.
  await expect(quizQuestion(page, QUESTIONS[2]!.text)).toBeVisible();
});

test("Customize questions from a different question remembers that one instead", async ({
  page,
}) => {
  await page.goto(`/create?game=${GAME_ID}`);
  await page.getByRole("button", { name: "Start the quiz" }).click();

  // Leave for the builder straight from question 1, with nothing answered.
  await expect(quizQuestion(page, QUESTIONS[0]!.text)).toBeVisible();
  await page.getByRole("link", { name: "Customize questions" }).click();
  await page.getByRole("link", { name: "Back to the quiz" }).click();
  await expect(quizQuestion(page, QUESTIONS[0]!.text)).toBeVisible();
});
