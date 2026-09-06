import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Shared helpers for driving the real A/B flow through the actual rendered
 * UI (no shortcuts, no direct DB/RPC calls — that's what tests/integration/
 * is for). Every locator here is scoped by ARIA role/name or by the
 * question's own `aria-label` (`Question: <text>` on its `<article>`,
 * components/questionnaire/question-card.tsx) rather than by adding any
 * data-testid to production markup — none was needed or added.
 *
 * Each Playwright test gets a fresh browser context by default, which
 * means a fresh Anonymous Auth session (a new "A") — no explicit DB reset
 * is needed between tests for that reason, only between steps of the same
 * test that deliberately reuse one identity.
 */

/** Starts a brand new draft as A and lands on "Build your questionnaire". */
export async function startDraft(page: Page): Promise<void> {
  await page.goto("/create");
  await page.getByRole("button", { name: "Start building your Wavelength" }).click();
  await expect(page.getByRole("heading", { name: "Build your questionnaire" })).toBeVisible();
}

/** The "Add a question" form — the one not yet attached to any created question. */
function addQuestionForm(page: Page): Locator {
  return page.locator("form", { has: page.getByRole("heading", { name: "Add a question" }) });
}

/** The card for one already-created question, scoped by its exact text
 * (matches the <article aria-label="Question: ..."> QuestionCard renders).
 * Only used on A's builder page (/create) — B's answer page renders each
 * question as a plain <li> instead, see answerRow() below. */
export function questionCard(page: Page, text: string): Locator {
  return page.getByRole("article", { name: `Question: ${text}` });
}

/** One question's row on B's answer page (app/w/[token]/answer/page.tsx),
 * which — unlike the builder's QuestionCard — is a plain <li><p>text</p>
 * <AnswerControl/></li> with no aria-label to key off of. */
export function answerRow(page: Page, text: string): Locator {
  return page.locator("li", { has: page.getByText(text, { exact: true }) });
}

export async function addChoiceQuestion(
  page: Page,
  { text, options, category }: { text: string; options: string[]; category?: string },
): Promise<void> {
  const form = addQuestionForm(page);
  if (category) {
    await form.getByLabel("Category").selectOption({ label: category });
  }
  await form.getByLabel("Type").selectOption("choice");
  await form.getByLabel("Question text").fill(text);

  const optionInputs = form.locator('input[name="options"]');
  while ((await optionInputs.count()) < options.length) {
    await form.getByRole("button", { name: "Add option" }).click();
  }
  for (let i = 0; i < options.length; i++) {
    await optionInputs.nth(i).fill(options[i]!);
  }

  await form.getByRole("button", { name: "Add question" }).click();
  await expect(questionCard(page, text)).toBeVisible();
}

export async function addScaleQuestion(
  page: Page,
  { text, category }: { text: string; category?: string },
): Promise<void> {
  const form = addQuestionForm(page);
  if (category) {
    await form.getByLabel("Category").selectOption({ label: category });
  }
  await form.getByLabel("Type").selectOption("scale");
  await form.getByLabel("Question text").fill(text);
  await form.getByRole("button", { name: "Add question" }).click();
  await expect(questionCard(page, text)).toBeVisible();
}

/** The always-editable text/options form inside a specific question's card. */
export function editForm(card: Locator): Locator {
  // Distinguishes it from the answer <fieldset> (legend "Your answer") and
  // the type <select> (label "Type") that also live inside the same card.
  return card.locator("form", { has: card.getByLabel("Question text") });
}

export function answerFieldset(card: Locator): Locator {
  return card.getByRole("group", { name: "Your answer" });
}

/** AnswerControl's own <form> (the one wrapping the "Your answer" fieldset)
 * — scoped this precisely because QuestionEditForm, right above it in the
 * same card, now shows its own "Saved" text too (QA fix), so looking up
 * "Saved" anywhere in the whole card would match two elements. */
function answerControlForm(card: Locator): Locator {
  return answerFieldset(card).locator("xpath=ancestor::form[1]");
}

/** Selects a choice option by its visible option text and waits for the
 * auto-save "Saved" status (QA fix: no Save/Update button anywhere here). */
export async function answerChoice(card: Locator, optionText: string): Promise<void> {
  await answerFieldset(card).getByRole("radio", { name: optionText }).check();
  await expect(answerControlForm(card).getByText("Saved", { exact: true })).toBeVisible();
}

/** Selects a scale level by its exact fixed label (Nada/Poco/Moderadamente/
 * Muy importante, Extremadamente importante) and waits for auto-save. */
export async function answerScale(card: Locator, levelLabel: string): Promise<void> {
  await answerFieldset(card).getByRole("radio", { name: levelLabel }).check();
  await expect(answerControlForm(card).getByText("Saved", { exact: true })).toBeVisible();
}

/** The answer's own "Saved"/"" status text, scoped away from
 * QuestionEditForm's identically-worded one in the same card. */
export function answerSavedStatus(card: Locator): Locator {
  return answerControlForm(card).getByText("Saved", { exact: true });
}

export const SCALE_LABELS = [
  "Nada importante",
  "Poco importante",
  "Moderadamente importante",
  "Muy importante",
  "Extremadamente importante",
] as const;

/** Finalizes A's draft (alias + "Create my Wavelength") and returns the
 * share link shown on the resulting "Your Wavelength" page. */
export async function finalizeDraft(page: Page, alias = "Alex"): Promise<string> {
  await page.getByLabel("Your name").fill(alias);
  await page.getByRole("button", { name: "Create my Wavelength" }).click();
  await expect(page.getByRole("heading", { name: "Your Wavelength" })).toBeVisible();
  return page.locator("#share-link").inputValue();
}

/** Waits out the "Finding your wavelength…" reveal delay and confirms the
 * result screen actually rendered (components/result/result-reveal.tsx). */
export async function expectResultVisible(page: Page): Promise<void> {
  await expect(page.getByRole("heading", { name: "Are you on the same wavelength?" })).toBeVisible({
    timeout: 10_000,
  });
}

/** B opens the share link and claims the wavelength (JoinForm), landing on
 * the answer page. */
export async function joinAsB(page: Page, shareLink: string, alias = "Bailey"): Promise<void> {
  await page.goto(shareLink);
  await page.getByLabel("Your name").fill(alias);
  await page.getByRole("button", { name: "Start answering" }).click();
  await expect(page.getByRole("heading", { name: "Answer the questions" })).toBeVisible();
}

/** B's final submission ("See our results"), only rendered once every
 * question has been answered. */
export async function submitFinal(page: Page): Promise<void> {
  await page.getByRole("button", { name: "See our results" }).click();
}
