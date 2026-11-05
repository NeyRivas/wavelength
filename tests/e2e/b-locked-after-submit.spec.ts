import { expect, test } from "@playwright/test";

import {
  addChoiceQuestion,
  answerChoice,
  answerPageHeading,
  answerRow,
  clickAnswerOption,
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
 * The scenario: an answer form that was rendered before B submitted and is
 * still live in the browser — what a restored "go back" page or a second
 * open tab leaves behind. Its radios call straight into the Server Action
 * without the server ever re-running app/w/[token]/answer/page.tsx's own
 * "already completed" guard. A second tab of the same browser (same B
 * identity), opened on the answer page before submitting, reproduces that
 * every time; relying on Back alone didn't, since whether the browser
 * restores the stale page or re-renders it varies run to run (the sibling
 * test below covers what Back shows today).
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

  // The same B, with the answer form also open in a second tab.
  const staleTab = await bContext.newPage();
  await staleTab.goto(bPage.url());
  await expect(answerPageHeading(staleTab)).toBeVisible();

  for (const q of QUESTIONS) {
    await answerChoice(answerRow(bPage, q.text), q.options[0]!);
  }
  await submitFinal(bPage);
  await expectResultVisible(bPage);

  // The stale form still looks editable; change a response exactly as a
  // real user would.
  await clickAnswerOption(answerRow(staleTab, QUESTIONS[0]!.text), QUESTIONS[0]!.options[1]!);

  // The end state must be: B is looking at the result (not stuck on an
  // editable form), and never saw the generic, unhelpful error.
  await expectResultVisible(staleTab);
  await expect(answerPageHeading(staleTab)).not.toBeVisible();
  await expect(staleTab.getByText("Something went wrong. Please try again.")).not.toBeVisible();

  await bContext.close();
});

/**
 * QA fix (routing/navigation pass): the sibling test above covers B editing
 * an answer from the stale, back-navigated form. This one covers the other
 * live control that same stale snapshot leaves wired up — the "See our
 * results" submit button itself — which used to call submitFinalB()
 * unconditionally and surface its raw RPC rejection ("...not in IN_PROGRESS
 * state") instead of the locked "Nice try!" state. Also confirms Back no
 * longer even shows the editable form in the first place (app/actions/
 * join.ts now revalidates /answer on completion, so the Router Cache can't
 * hand back the pre-completion snapshot), and that both of the locked
 * page's actions are present.
 */
test("B resubmitting from the stale answer form lands on the locked state, not a raw error", async ({
  page,
  browser,
}) => {
  await startDraft(page);
  for (const q of QUESTIONS) {
    await addChoiceQuestion(page, q);
    await answerChoice(questionCard(page, q.text), q.options[0]!);
  }
  const shareLink = await finalizeDraft(page, "Alex");

  const bContext = await browser.newContext();
  const bPage = await bContext.newPage();
  await joinAsB(bPage, shareLink, "Bailey");

  for (const q of QUESTIONS) {
    await answerChoice(answerRow(bPage, q.text), q.options[0]!);
  }
  await submitFinal(bPage);
  await expectResultVisible(bPage);

  await bPage.goBack();

  // The fix: Back must not restore the live, submittable form at all.
  await expect(answerPageHeading(bPage)).not.toBeVisible();
  await expect(bPage.getByRole("heading", { name: "Nice try! 😄" })).toBeVisible();
  await expect(bPage.getByRole("link", { name: "See your result" })).toBeVisible();
  // Product decision (confirmation-before-navigating): "Create your own
  // quiz" is now a button that opens a confirm dialog, not a plain
  // link — see tests/e2e/result-actions.spec.ts for the dialog itself.
  await expect(bPage.getByRole("button", { name: "Create your own quiz" })).toBeVisible();

  await expect(bPage.getByText("not in IN_PROGRESS state")).not.toBeVisible();
  await expect(bPage.getByText("Something went wrong. Please try again.")).not.toBeVisible();

  await bContext.close();
});
