import { describe, expect, it } from "vitest";

import { buildResultText, buildShareSummaryText } from "../../lib/wavelength/export";
import {
  buildWavelengthResultView,
  type ResultAnswerRow,
  type ResultQuestionRow,
} from "../../lib/wavelength/result";

// Small, hand-checkable dataset reused across both functions under test —
// deliberately includes one aligned question (q1) and one different one
// (q2), so both "Where You're Aligned" and "Different Wavelengths" have at
// least one row to check content against.
const questions: ResultQuestionRow[] = [
  {
    id: "q1",
    category: "relationship",
    type: "choice",
    text: "Ideal weekend?",
    options: ["Stay in", "Go out"],
    order_index: 0,
  },
  {
    id: "q2",
    category: "money",
    type: "choice",
    text: "Unexpected bonus arrives",
    options: ["Save it", "Spend it"],
    order_index: 1,
  },
];

const answers: ResultAnswerRow[] = [
  { question_id: "q1", participant: "A", value: 0 },
  { question_id: "q1", participant: "B", value: 0 },
  { question_id: "q2", participant: "A", value: 0 },
  { question_id: "q2", participant: "B", value: 1 },
];

const view = buildWavelengthResultView(questions, answers);
const aliasA = "Alex";
const aliasB = "Bailey";

describe("buildResultText (download — same viewer the Result page already authorized)", () => {
  it("includes both aliases and the overall score/level", () => {
    const text = buildResultText(view, aliasA, aliasB);
    expect(text).toContain(aliasA);
    expect(text).toContain(aliasB);
    expect(text).toContain(`${view.global.score}%`);
    expect(text).toContain(view.global.level);
  });

  it("includes every category's score", () => {
    const text = buildResultText(view, aliasA, aliasB);
    for (const c of view.categories) {
      expect(text).toContain(`${c.score}%`);
    }
  });

  it("includes question text and both participants' individual answers — same data the Result page already shows this viewer", () => {
    const text = buildResultText(view, aliasA, aliasB);
    for (const q of [...view.whereAligned, ...view.differentWavelengths]) {
      expect(text).toContain(q.text);
      expect(text).toContain(q.answerA);
      expect(text).toContain(q.answerB);
    }
  });
});

describe("buildShareSummaryText (share — privacy-safe, may reach a non-participant)", () => {
  it("includes both aliases and the overall score/level", () => {
    const text = buildShareSummaryText(view, aliasA, aliasB);
    expect(text).toContain(aliasA);
    expect(text).toContain(aliasB);
    expect(text).toContain(`${view.global.score}%`);
    expect(text).toContain(view.global.level);
  });

  it("includes category-level scores", () => {
    const text = buildShareSummaryText(view, aliasA, aliasB);
    for (const c of view.categories) {
      expect(text).toContain(`${c.score}%`);
    }
  });

  it("never includes any question's text", () => {
    const text = buildShareSummaryText(view, aliasA, aliasB);
    for (const q of view.allQuestions) {
      expect(text).not.toContain(q.text);
    }
  });

  it("never includes either participant's individual answer text", () => {
    const text = buildShareSummaryText(view, aliasA, aliasB);
    for (const q of view.allQuestions) {
      // formatAnswer'd option/scale labels — asserting on both A's and B's
      // exact rendered answer text for every question, not just the
      // aligned/different subsets, so nothing question-level leaks either
      // way this data could theoretically be sliced in the future.
      expect(text).not.toContain(q.answerA);
      expect(text).not.toContain(q.answerB);
    }
  });

  it("never includes a per-question score/match percentage", () => {
    const text = buildShareSummaryText(view, aliasA, aliasB);
    for (const q of view.allQuestions) {
      expect(text).not.toContain(`${q.score}% match`);
    }
  });
});
