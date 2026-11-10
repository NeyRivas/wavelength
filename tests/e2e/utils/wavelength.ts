import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Shared helpers for driving the real A/B flow through the actual rendered
 * UI (no shortcuts, no direct DB/RPC calls — that's what tests/integration/
 * is for). Every locator here is scoped by ARIA role/name or by a card's
 * own `aria-label` rather than by adding any data-testid to production
 * markup — none was needed or added.
 *
 * Each Playwright test gets a fresh browser context by default, which
 * means a fresh Anonymous Auth session (a new "A") — no explicit DB reset
 * is needed between tests for that reason, only between steps of the same
 * test that deliberately reuse one identity.
 *
 * Waiting: the builder and the answer page save on their own (on change
 * or on blur), and their "Saved" text is not proof of a save —
 * AnswerControl shows "Saved" as soon as an answer is picked, before the
 * request even starts, and QuestionEditForm shows it whenever it isn't
 * saving. So every helper that triggers an auto-save waits for that save's
 * own Server Action response (withServerAction) before returning, and
 * then for the UI it changes. No fixed sleeps anywhere.
 */

/** Matches the POST a Next.js Server Action makes (it carries a
 * `Next-Action` header). */
function isServerAction(response: import("@playwright/test").Response): boolean {
  const request = response.request();
  return request.method() === "POST" && request.headers()["next-action"] !== undefined;
}

/**
 * Runs `trigger` (a click, a check, a blur…) and waits until the Server
 * Action it fires has answered. Rejects if the action failed on the
 * server, so a broken save surfaces where it happened instead of as a
 * confusing assertion later.
 */
export async function withServerAction(page: Page, trigger: () => Promise<void>): Promise<void> {
  const response = page.waitForResponse(isServerAction);
  await trigger();
  const settled = await response;
  // Next runs the action before it starts answering, so a response means
  // the save happened. (Not `finished()`: the client stops reading the
  // streamed reply once it has what it needs, so Chromium reports the
  // request as aborted and `finished()` never resolves.) Callers then wait
  // for the UI change the save causes.
  expect(settled.ok(), `Server Action answered ${settled.status()}`).toBe(true);
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Starts a brand new Make Your Own draft as A and lands on its first,
 * already-open question form. */
export async function startDraft(page: Page): Promise<void> {
  await page.goto("/create");
  await expect(page.getByRole("heading", { level: 1, name: "Make Your Own" })).toBeVisible();
  await withServerAction(page, () =>
    page.getByRole("button", { name: "+ Add your first question" }).click(),
  );
  await expect(addQuestionForm(page)).toBeVisible();
}

/** The open "add a question" form — the one whose submit button is
 * "+ Add question" (the collapsed trigger's name also carries its count,
 * e.g. "+ Add question (2/12)"). */
function addQuestionForm(page: Page): Locator {
  return page.locator("form", {
    has: page.getByRole("button", { name: "+ Add question", exact: true }),
  });
}

/** The collapsed "+ Add question (N/12)" bar that opens the add form. */
function addQuestionTrigger(page: Page): Locator {
  return page.getByRole("button", { name: /^\+ Add question \(\d+\/\d+\)$/ });
}

/** Opens the add form if it's collapsed behind its trigger. It's only ever
 * open on its own for a draft's very first question (startDraft); after
 * every add, submitNewQuestion waits for it to collapse again, so by the
 * time this runs one of the two is settled on screen. */
async function openAddQuestionForm(page: Page): Promise<Locator> {
  const form = addQuestionForm(page);
  await expect(form.or(addQuestionTrigger(page))).toBeVisible();
  if ((await addQuestionTrigger(page).count()) > 0) {
    await addQuestionTrigger(page).click();
  }
  await expect(form).toBeVisible();
  return form;
}

/** The card for one already-created question on A's builder, scoped by its
 * exact text (QuestionCard's `<article aria-label="Question: …">`). */
export function questionCard(page: Page, text: string): Locator {
  return page.getByRole("article", { name: `Question: ${text}`, exact: true });
}

/** One question's card on B's answer page (AnswerQuestionCard's
 * `<article aria-label="Question N: …">`). */
export function answerRow(page: Page, text: string): Locator {
  return page.getByRole("article", { name: new RegExp(`^Question \\d+: ${escapeRegExp(text)}$`) });
}

/** A labelled pill/radio option, picked the way a person does it: by
 * clicking its visible label. The radios themselves are visually hidden
 * inside their pills, so clicking the input directly hits whatever is
 * drawn on top of it instead. */
async function pickOption(group: Locator, name: string): Promise<void> {
  // `has` is evaluated relative to each label, so it's built from the page.
  const radio = group.page().getByRole("radio", { name, exact: true });
  await group.locator("label", { has: radio }).click();
  await expect(group.getByRole("radio", { name, exact: true })).toBeChecked();
}

async function fillNewQuestion(
  form: Locator,
  { text, type, category }: { text: string; type: "choice" | "scale"; category: string },
): Promise<void> {
  await pickOption(form.getByRole("radiogroup", { name: "Category" }), category);
  await pickOption(
    form.getByRole("radiogroup", { name: "Question type" }),
    type === "choice" ? "Choice Pick one answer" : "Scale / Importance Choose where you land",
  );
  await form.getByRole("textbox", { name: "Question", exact: true }).fill(text);
}

async function submitNewQuestion(page: Page, form: Locator, text: string): Promise<void> {
  await withServerAction(page, () =>
    form.getByRole("button", { name: "+ Add question", exact: true }).click(),
  );
  await expect(questionCard(page, text)).toBeVisible();
  // A successful add collapses the form back behind its trigger.
  await expect(addQuestionTrigger(page)).toBeVisible();
}

export async function addChoiceQuestion(
  page: Page,
  {
    text,
    options,
    category = "Relationship",
  }: { text: string; options: string[]; category?: string },
): Promise<void> {
  const form = await openAddQuestionForm(page);
  await fillNewQuestion(form, { text, type: "choice", category });

  const optionInputs = form.locator('input[name="options"]');
  await expect(optionInputs).toHaveCount(2);
  for (let i = 2; i < options.length; i++) {
    await form.getByRole("button", { name: "+ Add option" }).click();
    await expect(optionInputs).toHaveCount(i + 1);
  }
  for (let i = 0; i < options.length; i++) {
    await optionInputs.nth(i).fill(options[i]!);
  }

  await submitNewQuestion(page, form, text);
}

export async function addScaleQuestion(
  page: Page,
  { text, category = "Relationship" }: { text: string; category?: string },
): Promise<void> {
  const form = await openAddQuestionForm(page);
  await fillNewQuestion(form, { text, type: "scale", category });
  await submitNewQuestion(page, form, text);
}

/** The always-editable category/text/options form inside a specific
 * question's card (QuestionEditForm) — the one holding the question's own
 * text field, as opposed to the answer form or the type control. */
export function editForm(card: Locator): Locator {
  return card.locator("form", {
    has: card.page().getByRole("textbox", { name: "Question", exact: true }),
  });
}

/** The question-text field inside a builder card. */
export function questionTextField(card: Locator): Locator {
  return card.getByRole("textbox", { name: "Question", exact: true });
}

/** A builder card's option text inputs, in order. */
export function optionInputs(card: Locator): Locator {
  return editForm(card).locator('input[name="options"]');
}

/** Replaces a field's value and leaves it, the way the builder expects
 * (it saves on blur), waiting for that save to complete — its response,
 * then the form settling: QuestionEditForm disables its fields while the
 * save is pending, so the field is enabled again only once React has
 * finished applying the result (when an uncontrolled field would already
 * have been reset). */
export async function editAndBlur(page: Page, field: Locator, value: string): Promise<void> {
  // A question-text edit renames its card (and so the locator `field` was
  // found through); re-find the field by its own id afterwards when it has
  // one.
  const id = await field.getAttribute("id");
  await field.fill(value);
  await withServerAction(page, () => field.press("Tab"));
  await expect(id ? page.locator(`[id="${id}"]`) : field).toBeEnabled();
}

/** Changes a saved question's category (it saves as soon as it changes),
 * waiting for the save and for the form to settle: once the save's
 * response is in, React still resets the form's uncontrolled fields, and
 * typing into the question field before that lands mid-reset (the old
 * text comes back with the new text inserted in front of it).
 * QuestionEditForm disables its fields while saving, so enabled again
 * means settled. */
export async function changeCategory(page: Page, card: Locator, category: string): Promise<void> {
  const group = editForm(card).getByRole("radiogroup", { name: "Category" });
  await withServerAction(page, () => pickOption(group, category));
  await expect(questionTextField(card)).toBeEnabled();
}

/** The radio for one category in a builder card's category group. */
export function categoryRadio(card: Locator, category: string): Locator {
  return editForm(card)
    .getByRole("radiogroup", { name: "Category" })
    .getByRole("radio", { name: category, exact: true });
}

export function answerFieldset(card: Locator): Locator {
  return card.getByRole("group", { name: "Your answer" });
}

/** AnswerControl's own <form> (the one wrapping the "Your answer"
 * fieldset) — scoped this precisely because QuestionEditForm, right above
 * it in the same card, shows its own "Saved" text too. */
function answerControlForm(card: Locator): Locator {
  return answerFieldset(card).locator("xpath=ancestor::form[1]");
}

/** One answer radio inside a card's "Your answer" group. */
export function answerRadio(card: Locator, optionText: string): Locator {
  return answerFieldset(card).getByRole("radio", { name: optionText, exact: true });
}

/** Clicks an answer option's label without waiting for anything — for
 * forms whose click is expected to navigate away instead of saving (a
 * stale, already-submitted answer page). */
export async function clickAnswerOption(card: Locator, optionText: string): Promise<void> {
  const radio = card.page().getByRole("radio", { name: optionText, exact: true });
  await answerFieldset(card).locator("label", { has: radio }).click();
}

/** Picks an answer (a choice option by its text, or a scale level by its
 * label) and waits for that answer's own save to finish. Works on A's
 * builder cards and on B's answer cards. */
export async function answerChoice(card: Locator, optionText: string): Promise<void> {
  const page = card.page();
  await withServerAction(page, () => pickOption(answerFieldset(card), optionText));
  await expect(answerControlForm(card).getByText("Saved", { exact: true })).toBeVisible();
}

/** Selects a scale level by its exact fixed label (Not/Slightly/Moderately/
 * Very/Extremely important) and waits for its save. */
export async function answerScale(card: Locator, levelLabel: string): Promise<void> {
  await answerChoice(card, levelLabel);
}

/** The answer's own "Saved"/"" status text, scoped away from
 * QuestionEditForm's identically-worded one in the same card. */
export function answerSavedStatus(card: Locator): Locator {
  return answerControlForm(card).getByText("Saved", { exact: true });
}

export const SCALE_LABELS = [
  "Not important",
  "Slightly important",
  "Moderately important",
  "Very important",
  "Extremely important",
] as const;

/** Finalizes A's draft (alias + the finalize button) and returns the share
 * link shown on the resulting "Your answers are in." page
 * (components/wavelength/review-intro.tsx). Every caller here builds a
 * generic Make Your Own draft, so the finalize button always shows the
 * default copy (lib/wavelength/experience-copy.ts's MAKE_YOUR_OWN_COPY) —
 * a ready-made game's own draft shows a different, contextual label. */
export async function finalizeDraft(page: Page, alias = "Alex"): Promise<string> {
  await page.getByLabel("Your name").fill(alias);
  await page
    .getByRole("button", { name: "Answer. Share. See how much you're on the same page." })
    .click();
  await expect(page.getByRole("heading", { name: "Your answers are in." })).toBeVisible();
  const shareLink = page.locator("#share-link");
  await expect(shareLink).toHaveValue(/\/w\/[0-9a-f]{32}$/);
  return shareLink.inputValue();
}

/** Confirms the result screen actually rendered (components/result/
 * global-summary.tsx). Scoped by id rather than heading text: the heading
 * names both participants and is worded per game. Its own 10s timeout
 * covers the result's deliberate "Finding your wavelength…" reveal. */
export async function expectResultVisible(page: Page): Promise<void> {
  await expect(page.locator("#global-summary-heading")).toBeVisible({ timeout: 10_000 });
}

/** B's answer page heading for a Make Your Own wavelength. */
export function answerPageHeading(page: Page): Locator {
  return page.getByRole("heading", { level: 1, name: "Time to answer" });
}

/** B opens the share link and claims the wavelength (JoinForm), landing on
 * the answer page. */
export async function joinAsB(page: Page, shareLink: string, alias = "Bailey"): Promise<void> {
  await page.goto(shareLink);
  await page.getByLabel("Your name").fill(alias);
  await page.getByRole("button", { name: "Start answering" }).click();
  await expect(answerPageHeading(page)).toBeVisible();
}

/** B's final submission ("See our results"), only rendered once every
 * question has been answered. */
export async function submitFinal(page: Page): Promise<void> {
  await page.getByRole("button", { name: "See our results" }).click();
}

/** The guided quiz's current question (components/quiz/quiz-stepper.tsx):
 * a <section> labelled by its own question heading. Ready-made games
 * (/create?game=… and B's answer page) play here instead of the builder. */
export function quizQuestion(page: Page, text: string): Locator {
  return page.getByRole("region", { name: text, exact: true });
}

/** Taps one answer on the current guided-quiz question; the quiz saves it
 * and moves on by itself. */
export async function answerQuizChoice(
  page: Page,
  questionText: string,
  optionText: string,
): Promise<void> {
  const card = quizQuestion(page, questionText);
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: optionText, exact: true }).click();
  await expect(card).toBeHidden();
}

/** A's guided-quiz step in games where A writes their own options (How
 * Well Do You Know Me?, Friendship Check): fills the answer fields, marks
 * the real one, and moves on. */
export async function writeQuizOptions(
  page: Page,
  questionText: string,
  options: string[],
  realOption: string,
): Promise<void> {
  const card = quizQuestion(page, questionText);
  await expect(card).toBeVisible();
  for (let i = 0; i < options.length; i++) {
    const field = card.getByRole("textbox", { name: `Answer ${i + 1}`, exact: true });
    if ((await field.count()) === 0) {
      await card.getByRole("button", { name: "+ Add another answer" }).click();
    }
    await field.fill(options[i]!);
  }
  await card
    .getByRole("radio", { name: `Answer ${options.indexOf(realOption) + 1} is the real one` })
    .check();
  await card.getByRole("button", { name: /^(Next|Finish)/ }).click();
  await expect(card).toBeHidden();
}
