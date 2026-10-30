import { expect, test } from "@playwright/test";

import { getExperienceCopy } from "../../lib/wavelength/experience-copy";
import { getReadyMadeGame } from "../../lib/wavelength/ready-made-games";
import {
  answerQuizChoice,
  expectResultVisible,
  quizQuestion,
  submitFinal,
} from "./utils/wavelength";

/**
 * The guided quiz end to end (components/quiz/quiz-stepper.tsx), for the
 * couples compatibility test: A plays every question one at a time
 * (resuming where they left off after a reload), shares the link, B plays
 * the same questions in the same stepper, and both land on the result.
 *
 * Needs the real Supabase Anonymous Auth backend (see playwright.config.ts).
 */

const GAME_ID = "how-well-do-you-know-each-other";
const QUESTIONS = getReadyMadeGame(GAME_ID)!.questions!;

/** The answer to tap for question `index`: the first option (or "Very
 * important" on the scale question), or the second option when `differ`. */
function answerFor(index: number, differ = false): string {
  const question = QUESTIONS[index]!;
  if (question.type === "scale") return differ ? "Not important" : "Very important";
  return question.options![differ ? 1 : 0]!;
}

test("A plays the compatibility test, shares it, B plays it, and both see the result", async ({
  page,
  browser,
}) => {
  await page.goto("/play/dating-couples/couples-compatibility-test");
  await page
    .getByRole("button", { name: /Start the compatibility test/ })
    .first()
    .click();
  await expect(page).toHaveURL(new RegExp(`/create\\?game=${GAME_ID}$`));

  for (let i = 0; i < 3; i++) {
    await answerQuizChoice(page, QUESTIONS[i]!.text, answerFor(i));
  }
  await expect(page.getByText(`3 of ${QUESTIONS.length} answered`)).toBeVisible();

  // Answers are saved as A goes: a reload resumes at the next question.
  await page.reload();
  await expect(quizQuestion(page, QUESTIONS[3]!.text)).toBeVisible();
  await expect(page.getByText(`3 of ${QUESTIONS.length} answered`)).toBeVisible();

  for (let i = 3; i < QUESTIONS.length; i++) {
    await answerQuizChoice(page, QUESTIONS[i]!.text, answerFor(i));
  }
  await expect(page.getByRole("heading", { name: "That's every question" })).toBeVisible();
  await expect(page.getByText(`${QUESTIONS.length} of ${QUESTIONS.length} answered`)).toBeVisible();

  await page.getByLabel("Your name").fill("Ana");
  await page.getByRole("button", { name: getExperienceCopy(GAME_ID).finalizeButtonLabel }).click();
  await expect(page.getByRole("heading", { name: "Your answers are in." })).toBeVisible();
  const shareLink = await page.locator("#share-link").inputValue();

  const bContext = await browser.newContext();
  const bPage = await bContext.newPage();
  await bPage.goto(shareLink);
  await bPage.getByLabel("Your name").fill("Leo");
  await bPage.getByRole("button", { name: "Start answering" }).click();
  await expect(quizQuestion(bPage, QUESTIONS[0]!.text)).toBeVisible();
  // B never gets the builder's editing controls.
  await expect(bPage.getByRole("link", { name: "Customize questions" })).toHaveCount(0);

  for (let i = 0; i < QUESTIONS.length; i++) {
    await answerQuizChoice(bPage, QUESTIONS[i]!.text, answerFor(i, i % 2 === 1));
  }
  await expect(bPage.getByRole("heading", { name: "That's every question" })).toBeVisible();
  await submitFinal(bPage);
  await expectResultVisible(bPage);
  await expect(bPage).toHaveURL(/\/w\/[^/]+\/result$/);

  // A's own link now opens the same result.
  await page.goto(shareLink);
  await expectResultVisible(page);

  await bContext.close();
});
