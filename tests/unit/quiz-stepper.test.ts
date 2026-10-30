// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ActionState } from "../../app/actions/shared";

// Renders components/quiz/quiz-stepper.tsx for real (React DOM in
// happy-dom). Only the Server Actions and next/link are replaced: the
// actions are spies that record exactly what the stepper would send, so
// these tests cover the order of saves, what counts as answered, and when
// the existing finalize/submit step appears.

const actions = vi.hoisted(() => ({
  saveAnswerA: vi.fn(),
  saveAnswerB: vi.fn(),
  updateQuestion: vi.fn(),
}));

vi.mock("@/app/actions/answers", () => ({
  saveAnswerA: actions.saveAnswerA,
  saveAnswerB: actions.saveAnswerB,
}));
vi.mock("@/app/actions/questions", () => ({ updateQuestion: actions.updateQuestion }));
vi.mock("next/link", async () => {
  const { createElement: h } = await import("react");
  return {
    default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) =>
      h("a", { href, ...rest }, children),
  };
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { QuizStepper, ADVANCE_DELAY_MS } = await import("../../components/quiz/quiz-stepper");
type Props = Parameters<typeof QuizStepper>[0];

const OK: ActionState = { error: null };

const QUESTIONS: Props["questions"] = [
  {
    id: "q1",
    type: "choice",
    category: "relationship",
    text: "What makes you feel most loved?",
    options: ["Quality time", "Words", "Gestures"],
  },
  {
    id: "q2",
    type: "scale",
    category: "future",
    text: "How important is marriage to you?",
    options: null,
  },
  {
    id: "q3",
    type: "choice",
    category: "money",
    text: "How do you approach money?",
    options: ["Saver", "Spender"],
  },
];

let root: Root | null = null;
let container: HTMLElement;

function render(overrides: Partial<Props> = {}) {
  const props: Props = {
    participant: "A",
    wavelengthId: "w1",
    questions: QUESTIONS,
    initialAnswers: {},
    hint: "Only you can see your answers.",
    customizeHref: "/create?game=g&mode=edit",
    completionHeading: "That's every question",
    completionText: "Add your name to lock them in.",
    completion: createElement("button", { type: "button" }, "Create my link"),
    ...overrides,
  };
  act(() => {
    root!.render(createElement(QuizStepper, props));
  });
}

const heading = () => container.querySelector("h2")?.textContent ?? "";
const buttonByText = (text: string) =>
  [...container.querySelectorAll("button")].find((button) => button.textContent?.includes(text));
const option = (label: string) =>
  [...container.querySelectorAll<HTMLButtonElement>(".quiz-option")].find(
    (button) => button.textContent === label,
  );

async function click(element: Element | null | undefined) {
  expect(element).toBeTruthy();
  await act(async () => {
    (element as HTMLElement).click();
  });
}

/** Lets the auto-advance delay and any queued saves finish. */
async function settle(ms = ADVANCE_DELAY_MS + 50) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

function typeInto(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  act(() => {
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function sentFields(call: unknown[]): Record<string, unknown> {
  const formData = call[1] as FormData;
  const fields: Record<string, unknown> = {};
  for (const key of new Set(formData.keys())) {
    const values = formData.getAll(key);
    fields[key] = values.length > 1 ? values : values[0];
  }
  return fields;
}

beforeEach(() => {
  for (const action of Object.values(actions)) action.mockReset().mockResolvedValue(OK);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  container.remove();
});

describe("QuizStepper", () => {
  it("shows one question at a time, starting with the first", () => {
    render();
    expect(heading()).toBe("What makes you feel most loved?");
    expect(container.querySelectorAll(".quiz-card")).toHaveLength(1);
    expect(container.textContent).toContain("Question 1 of 3");
    expect(container.textContent).toContain("0 of 3 answered");
    expect(container.querySelector("a")?.getAttribute("href")).toBe("/create?game=g&mode=edit");
  });

  it("saves a tapped answer with saveAnswerA and moves on by itself", async () => {
    render();
    await click(option("Words"));

    expect(actions.saveAnswerA).toHaveBeenCalledTimes(1);
    expect(sentFields(actions.saveAnswerA.mock.calls[0]!)).toEqual({
      wavelengthId: "w1",
      questionId: "q1",
      value: "1",
    });
    expect(option("Words")?.getAttribute("aria-pressed")).toBe("true");

    await settle();
    expect(heading()).toBe("How important is marriage to you?");
    expect(container.textContent).toContain("1 of 3 answered");
  });

  it("answers a scale question with its fixed labels and stored value", async () => {
    render({ initialAnswers: { q1: 0 } });
    expect(heading()).toBe("How important is marriage to you?");
    const labels = [...container.querySelectorAll(".quiz-option")].map((b) => b.textContent);
    expect(labels).toEqual([
      "Not important",
      "Slightly important",
      "Moderately important",
      "Very important",
      "Extremely important",
    ]);
    await click(option("Very important"));
    expect(sentFields(actions.saveAnswerA.mock.calls[0]!).value).toBe("75");
  });

  it("resumes at the first unanswered question", () => {
    render({ initialAnswers: { q1: 2, q2: 50 } });
    expect(heading()).toBe("How do you approach money?");
  });

  it("runs saves one after another, in the order they were made", async () => {
    let releaseFirst!: (value: ActionState) => void;
    actions.saveAnswerA
      .mockImplementationOnce(() => new Promise<ActionState>((resolve) => (releaseFirst = resolve)))
      .mockResolvedValue(OK);
    render();

    await click(option("Quality time"));
    await click(option("Gestures"));
    // The second save waits for the first one to finish.
    expect(actions.saveAnswerA).toHaveBeenCalledTimes(1);

    await act(async () => releaseFirst(OK));
    await settle(0);
    expect(actions.saveAnswerA).toHaveBeenCalledTimes(2);
    expect(sentFields(actions.saveAnswerA.mock.calls[1]!).value).toBe("2");
  });

  it("doesn't save again when the same answer is tapped, but still moves on", async () => {
    render({ initialAnswers: { q1: 1 } });
    await click(buttonByText("Previous") ?? null); // already on q2; go back to q1
    expect(heading()).toBe("What makes you feel most loved?");
    await click(option("Words"));
    await settle();
    expect(actions.saveAnswerA).not.toHaveBeenCalled();
    expect(heading()).toBe("How important is marriage to you?");
  });

  it("still saves a change of mind back to the saved answer while another save is pending", async () => {
    let releaseFirst!: (value: ActionState) => void;
    actions.saveAnswerA
      .mockImplementationOnce(() => new Promise<ActionState>((resolve) => (releaseFirst = resolve)))
      .mockResolvedValue(OK);
    render({ initialAnswers: { q1: 1 } });
    await click(buttonByText("Previous"));

    await click(option("Gestures"));
    await click(option("Words"));
    await act(async () => releaseFirst(OK));
    await settle();

    expect(actions.saveAnswerA.mock.calls.map((call) => sentFields(call).value)).toEqual([
      "2",
      "1",
    ]);
  });

  it("reports a failed save and keeps it out of the progress", async () => {
    actions.saveAnswerA.mockResolvedValueOnce({ error: "Something went wrong." });
    render();
    await click(option("Words"));
    await settle();

    expect(heading()).toBe("How important is marriage to you?");
    expect(container.textContent).toContain("0 of 3 answered");
    expect(container.textContent).toContain("We couldn't save your answer to question 1.");

    await click(buttonByText("Go back to it"));
    expect(heading()).toBe("What makes you feel most loved?");
    expect(container.textContent).toContain("Something went wrong.");
  });

  it("only shows the completion step once every answer is saved", async () => {
    render({ initialAnswers: { q1: 0, q2: 25 } });
    expect(buttonByText("Create my link")).toBeUndefined();

    await click(option("Saver"));
    await settle();
    expect(heading()).toBe("That's every question");
    expect(container.textContent).toContain("3 of 3 answered");
    expect(buttonByText("Create my link")).toBeTruthy();
  });

  it("holds back the completion step while a question is still unanswered", async () => {
    actions.saveAnswerA.mockResolvedValueOnce({ error: "Something went wrong." });
    render({ initialAnswers: { q1: 0, q2: 25 } });
    await click(option("Saver"));
    await settle();

    expect(heading()).toBe("That's every question");
    expect(buttonByText("Create my link")).toBeUndefined();
    expect(container.textContent).toContain("We couldn't save your answer to question 3.");
  });

  it("goes straight to the completion step when everything is already answered", () => {
    render({ initialAnswers: { q1: 0, q2: 25, q3: 1 } });
    expect(heading()).toBe("That's every question");
    expect(buttonByText("Create my link")).toBeTruthy();
  });

  it("saves B's answers with saveAnswerB and has no customize link", async () => {
    render({ participant: "B", customizeHref: undefined });
    expect(container.querySelector("a")).toBeNull();
    await click(option("Quality time"));
    expect(actions.saveAnswerB).toHaveBeenCalledTimes(1);
    expect(actions.saveAnswerA).not.toHaveBeenCalled();
  });

  it("stops quietly when B's save redirects to the result", async () => {
    actions.saveAnswerB.mockResolvedValueOnce(undefined);
    render({ participant: "B", customizeHref: undefined });
    await click(option("Quality time"));
    await settle();
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });
});

const WRITTEN_TOO_FEW = "Write at least 2 possible answers.";

describe("QuizStepper — A writes their own options", () => {
  const WRITTEN: Props["questions"] = [
    {
      id: "w1q",
      type: "choice",
      category: "lifestyle",
      text: "Which artist could I listen to over and over?",
      options: [" ", " "],
    },
    {
      id: "w2q",
      type: "choice",
      category: "lifestyle",
      text: "What's my most irrational opinion?",
      options: [" ", " "],
    },
  ];

  const answerInputs = () =>
    [...container.querySelectorAll<HTMLInputElement>('input[type="text"]')].filter((input) =>
      input.getAttribute("aria-label")?.startsWith("Answer"),
    );
  const realOneRadios = () =>
    [...container.querySelectorAll<HTMLInputElement>('input[type="radio"]')].filter((input) =>
      input.getAttribute("aria-label")?.endsWith("is the real one"),
    );

  it("shows answer fields instead of choices", () => {
    render({ questions: WRITTEN, writesOwnOptions: true });
    expect(container.querySelectorAll(".quiz-option")).toHaveLength(0);
    expect(answerInputs()).toHaveLength(2);
    expect(answerInputs().map((input) => input.value)).toEqual(["", ""]);
  });

  it("asks for two answers and a real one before moving on", async () => {
    render({ questions: WRITTEN, writesOwnOptions: true });
    typeInto(answerInputs()[0]!, "Taylor Swift");
    await click(buttonByText("Next"));
    expect(container.textContent).toContain("Write at least 2 possible answers.");

    typeInto(answerInputs()[1]!, "Bad Bunny");
    await click(buttonByText("Next"));
    expect(container.textContent).toContain("Mark which answer is the real one.");
    expect(actions.updateQuestion).not.toHaveBeenCalled();
    expect(actions.saveAnswerA).not.toHaveBeenCalled();
  });

  it("clears a validation message as soon as A edits the answers", async () => {
    render({ questions: WRITTEN, writesOwnOptions: true });
    await click(buttonByText("Next"));
    expect(container.textContent).toContain(WRITTEN_TOO_FEW);
    typeInto(answerInputs()[0]!, "Taylor Swift");
    expect(container.textContent).not.toContain(WRITTEN_TOO_FEW);
  });

  it("saves the options with updateQuestion, then the real one with saveAnswerA", async () => {
    render({ questions: WRITTEN, writesOwnOptions: true });
    typeInto(answerInputs()[0]!, "Taylor Swift");
    typeInto(answerInputs()[1]!, "Bad Bunny");
    await click(buttonByText("+ Add another answer"));
    typeInto(answerInputs()[2]!, "Adele");
    await click(realOneRadios()[2]);
    await click(buttonByText("Next"));
    await settle(0);

    expect(sentFields(actions.updateQuestion.mock.calls[0]!)).toEqual({
      wavelengthId: "w1",
      questionId: "w1q",
      text: "Which artist could I listen to over and over?",
      category: "lifestyle",
      options: ["Taylor Swift", "Bad Bunny", "Adele"],
    });
    expect(sentFields(actions.saveAnswerA.mock.calls[0]!)).toMatchObject({
      questionId: "w1q",
      value: "2",
    });
    expect(actions.updateQuestion.mock.invocationCallOrder[0]!).toBeLessThan(
      actions.saveAnswerA.mock.invocationCallOrder[0]!,
    );
    expect(heading()).toBe("What's my most irrational opinion?");
    expect(container.textContent).toContain("1 of 2 answered");
  });

  it("keeps A on the question when the options can't be saved", async () => {
    actions.updateQuestion.mockResolvedValueOnce({ error: "options must be distinct" });
    render({ questions: WRITTEN, writesOwnOptions: true });
    typeInto(answerInputs()[0]!, "Taylor Swift");
    typeInto(answerInputs()[1]!, "Bad Bunny");
    await click(realOneRadios()[0]);
    await click(buttonByText("Next"));
    await settle(0);

    expect(actions.saveAnswerA).not.toHaveBeenCalled();
    expect(heading()).toBe("Which artist could I listen to over and over?");
    expect(container.textContent).toContain("options must be distinct");
  });

  it("shows A's saved options and real answer again, and skips re-saving unchanged options", async () => {
    render({
      questions: [{ ...WRITTEN[0]!, options: ["Taylor Swift", "Bad Bunny"] }, WRITTEN[1]!],
      writesOwnOptions: true,
      initialAnswers: { w1q: 1 },
    });
    await click(buttonByText("Previous"));
    expect(answerInputs().map((input) => input.value)).toEqual(["Taylor Swift", "Bad Bunny"]);
    expect(realOneRadios()[1]!.checked).toBe(true);

    await click(buttonByText("Next"));
    await settle(0);
    expect(actions.updateQuestion).not.toHaveBeenCalled();
    expect(sentFields(actions.saveAnswerA.mock.calls[0]!).value).toBe("1");
  });

  it("never shows answer fields to B", () => {
    render({
      participant: "B",
      customizeHref: undefined,
      writesOwnOptions: true,
      questions: [{ ...WRITTEN[0]!, options: ["Taylor Swift", "Bad Bunny"] }],
    });
    expect(answerInputs()).toHaveLength(0);
    expect(container.querySelectorAll(".quiz-option")).toHaveLength(2);
  });
});
