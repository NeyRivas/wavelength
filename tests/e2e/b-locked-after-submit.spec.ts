import { expect, test } from "@playwright/test";

import {
  addChoiceQuestion,
  answerChoice,
  answerRow,
  expectResultVisible,
  finalizeDraft,
  joinAsB,
  questionCard,
  startDraft,
  submitFinal,
} from "./utils/wavelength";

const QUESTIONS = [
  { text: "Question one", options: ["A1", "A2"] },
  { text: "Question two", options: ["A1", "A2"] },
  { text: "Question three", options: ["A1", "A2"] },
  { text: "Question four", options: ["A1", "A2"] },
  { text: "Question five", options: ["A1", "A2"] },
];

/**
 * E2E #4 — B locked after submitting. Unlike the other three specs, this
 * one exercises a fix already made (app/actions/answers.ts's saveAnswer():
 * checks the wavelength's actual state before writing, and redirects B to
 * the result instead of surfacing a raw error). The audit found this fix
 * had zero test coverage at any level — this spec is what closes that gap,
 * and is expected to PASS if the fix holds.
 *
 * The scenario specifically reproduces what a plain "go back" in a real
 * browser can do that a fresh server render can't: it restores an
 * already-rendered client page (the answer form B was just on) without the
 * server ever re-running app/w/[token]/answer/page.tsx's own "already
 * completed" guard, so the very next radio click calls straight into the
 * Server Action instead.
 */
test("B cannot modify an answer after submitting — no going back and no raw error", async ({
  page,
  browser,
}) => {
  // A: build, answer, and finalize a 5-question Wavelength.
  await startDraft(page);
  for (const q of QUESTIONS) {
    await addChoiceQuestion(page, q);
    await answerChoice(questionCard(page, q.text), q.options[0]!);
  }
  const shareLink = await finalizeDraft(page, "Alex");

  // B: join in a separate browser context — a genuinely different
  // Anonymous Auth identity, not just a second tab sharing A's cookies.
  const bContext = await browser.newContext();
  const bPage = await bContext.newPage();
  await joinAsB(bPage, shareLink, "Bailey");

  for (const q of QUESTIONS) {
    await answerChoice(answerRow(bPage, q.text), q.options[0]!);
  }
  await submitFinal(bPage);
  await expectResultVisible(bPage);

  // B tries to go back to the answer form and change a response.
  await bPage.goBack();

  const stillOnAnswerPage = await bPage
    .getByRole("heading", { name: "Answer the questions" })
    .isVisible()
    .catch(() => false);

  if (stillOnAnswerPage) {
    // The browser restored the stale, already-rendered answer page (the
    // scenario the fix specifically targets). Attempt to change a response
    // exactly as a real user would.
    await answerRow(bPage, QUESTIONS[0]!.text)
      .getByRole("radio", { name: QUESTIONS[0]!.options[1] })
      .check();
  }

  // Whichever path got us here, the end state must be: B is looking at the
  // result (not stuck on an editable form), and never saw the generic,
  // unhelpful error.
  await expectResultVisible(bPage);
  await expect(bPage.getByText("Something went wrong. Please try again.")).not.toBeVisible();

  await bContext.close();
});
