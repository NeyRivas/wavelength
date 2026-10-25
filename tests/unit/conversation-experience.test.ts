import { describe, expect, it } from "vitest";

import { parseAnswerValue } from "../../lib/validation/schemas";
import {
  buildConversationRecord,
  conversationQuestionCount,
  conversationQuestionTexts,
  ConversationRecordError,
  getConversationExperience,
  stagePositionForIndex,
  THIRTY_SIX_QUESTIONS,
  type ConversationAnswerRow,
  type ConversationQuestionRow,
} from "../../lib/wavelength/conversation-experiences";
import { getExperienceCopy } from "../../lib/wavelength/experience-copy";
import {
  numericAnswerRows,
  standardQuestionRows,
  writtenAnswerMap,
} from "../../lib/wavelength/question-rows";

const TEXTS = conversationQuestionTexts(THIRTY_SIX_QUESTIONS);

describe("THIRTY_SIX_QUESTIONS", () => {
  it("has exactly 36 questions in three stages of 12", () => {
    expect(conversationQuestionCount(THIRTY_SIX_QUESTIONS)).toBe(36);
    expect(TEXTS).toHaveLength(36);
    expect(
      THIRTY_SIX_QUESTIONS.stages.map((stage) => [
        stage.number,
        stage.title,
        stage.questions.length,
      ]),
    ).toEqual([
      [1, "Building a Connection", 12],
      [2, "Going Deeper", 12],
      [3, "Growing Closer", 12],
    ]);
  });

  it("fits the questions table's constraints (3-300 chars, unique per questionnaire)", () => {
    for (const text of TEXTS) {
      expect(text.trim().length).toBeGreaterThanOrEqual(3);
      expect(text.length).toBeLessThanOrEqual(300);
    }
    expect(new Set(TEXTS.map((text) => text.trim().toLowerCase())).size).toBe(36);
  });

  it("doesn't reproduce recognizable questions from the published research list", () => {
    const published = [
      "dinner guest",
      "would you like to be famous",
      "rehearse",
      "perfect” day",
      'perfect" day',
      "perfect day",
      "sing to yourself",
      "age of 90",
      "how you will die",
      "crystal ball",
      "four minutes",
      "most treasured memory",
      "most terrible memory",
      "“we” statements",
      '"we" statements',
      "house, containing everything you own",
      "embarrassing moments",
    ];
    for (const text of TEXTS) {
      for (const phrase of published) {
        expect(text.toLowerCase(), text).not.toContain(phrase);
      }
    }
  });

  it("is looked up by its game id", () => {
    expect(getConversationExperience("36-questions-to-fall-in-love")).toBe(THIRTY_SIX_QUESTIONS);
    expect(getConversationExperience("getting-to-know-you")).toBeUndefined();
    expect(getConversationExperience(null)).toBeUndefined();
  });
});

describe("stagePositionForIndex", () => {
  it("maps play order onto stages", () => {
    expect(stagePositionForIndex(THIRTY_SIX_QUESTIONS, 0)).toMatchObject({
      stageIndex: 0,
      indexInStage: 0,
      stageStart: 0,
    });
    expect(stagePositionForIndex(THIRTY_SIX_QUESTIONS, 11)).toMatchObject({
      stageIndex: 0,
      indexInStage: 11,
    });
    expect(stagePositionForIndex(THIRTY_SIX_QUESTIONS, 12)).toMatchObject({
      stageIndex: 1,
      indexInStage: 0,
      stageStart: 12,
    });
    expect(stagePositionForIndex(THIRTY_SIX_QUESTIONS, 35)).toMatchObject({
      stageIndex: 2,
      indexInStage: 11,
      stageStart: 24,
    });
    expect(() => stagePositionForIndex(THIRTY_SIX_QUESTIONS, 36)).toThrow(RangeError);
  });
});

function rows(): { questions: ConversationQuestionRow[]; answers: ConversationAnswerRow[] } {
  const questions = TEXTS.map((text, index) => ({ id: `q${index}`, text, order_index: index }));
  const answers = questions.flatMap((question, index): ConversationAnswerRow[] => [
    { question_id: question.id, participant: "A", value: `A says ${index}` },
    { question_id: question.id, participant: "B", value: `B says ${index}` },
  ]);
  return { questions, answers };
}

describe("buildConversationRecord", () => {
  it("pairs both answers per question, grouped 12/12/12 by stage, in play order", () => {
    const { questions, answers } = rows();
    // Input order must not matter.
    const record = buildConversationRecord(
      THIRTY_SIX_QUESTIONS,
      [...questions].reverse(),
      [...answers].reverse(),
    );

    expect(record.map((stage) => stage.entries.length)).toEqual([12, 12, 12]);
    expect(record.map((stage) => stage.stage.title)).toEqual([
      "Building a Connection",
      "Going Deeper",
      "Growing Closer",
    ]);
    expect(record[1]!.entries[0]).toEqual({
      id: "q12",
      number: 13,
      text: TEXTS[12],
      answerA: "A says 12",
      answerB: "B says 12",
    });
    expect(record.flatMap((stage) => stage.entries.map((entry) => entry.number))).toEqual(
      Array.from({ length: 36 }, (_, i) => i + 1),
    );
  });

  it("carries no score, percentage, or classification", () => {
    const { questions, answers } = rows();
    const json = JSON.stringify(buildConversationRecord(THIRTY_SIX_QUESTIONS, questions, answers));
    expect(json).not.toMatch(/score|level|percent|alignment|compatib|"High"|"Mixed"|"Low"/i);
  });

  it("refuses an incomplete or malformed record instead of showing part of it", () => {
    const { questions, answers } = rows();
    expect(() =>
      buildConversationRecord(THIRTY_SIX_QUESTIONS, questions, answers.slice(1)),
    ).toThrow(ConversationRecordError);
    expect(() =>
      buildConversationRecord(THIRTY_SIX_QUESTIONS, questions.slice(1), answers),
    ).toThrow(ConversationRecordError);
    expect(() =>
      buildConversationRecord(THIRTY_SIX_QUESTIONS, questions, [
        ...answers,
        { question_id: "q0", participant: "A", value: "again" },
      ]),
    ).toThrow(ConversationRecordError);
    expect(() =>
      buildConversationRecord(THIRTY_SIX_QUESTIONS, questions, [
        { ...answers[0]!, value: 2 },
        ...answers.slice(1),
      ]),
    ).toThrow(ConversationRecordError);
  });
});

function formWith(value: string): FormData {
  const formData = new FormData();
  formData.set("value", value);
  return formData;
}

describe("parseAnswerValue for open questions", () => {
  it("accepts written text, trimmed, newlines included", () => {
    expect(parseAnswerValue(formWith("  Coffee first.\nThen a walk.  "), { type: "open" })).toEqual(
      { success: true, data: "Coffee first.\nThen a walk." },
    );
  });

  it("rejects empty, oversized, and control-character answers", () => {
    expect(parseAnswerValue(formWith("   "), { type: "open" }).success).toBe(false);
    expect(parseAnswerValue(formWith("x".repeat(2001)), { type: "open" }).success).toBe(false);
    expect(parseAnswerValue(formWith("hi\u0007"), { type: "open" }).success).toBe(false);
  });

  it("leaves choice and scale parsing unchanged", () => {
    expect(parseAnswerValue(formWith("1"), { type: "choice", optionCount: 3 })).toEqual({
      success: true,
      data: 1,
    });
    expect(parseAnswerValue(formWith("Coffee"), { type: "choice", optionCount: 3 }).success).toBe(
      false,
    );
    expect(parseAnswerValue(formWith("50"), { type: "scale" })).toEqual({
      success: true,
      data: 50,
    });
  });
});

describe("standard-screen row guards", () => {
  it("pass choice/scale rows and numeric answers through unchanged", () => {
    const questions = [
      { id: "a", type: "choice" as const },
      { id: "b", type: "scale" as const },
    ];
    expect(standardQuestionRows(questions)).toBe(questions);
    const answers = [{ question_id: "a", value: 1 }];
    expect(numericAnswerRows(answers)).toBe(answers);
  });

  it("never let an open question or a written answer into a scored screen", () => {
    expect(() => standardQuestionRows([{ id: "a", type: "open" as const }])).toThrow();
    expect(() => numericAnswerRows([{ question_id: "a", value: "text" }])).toThrow();
  });

  it("writtenAnswerMap keeps only written answers", () => {
    expect(
      writtenAnswerMap([
        { question_id: "a", value: "hello" },
        { question_id: "b", value: 2 },
      ]),
    ).toEqual(new Map([["a", "hello"]]));
  });
});

describe("experience copy", () => {
  it("has its own invite/answer copy that names the other person and never mentions a score", () => {
    const copy = getExperienceCopy(THIRTY_SIX_QUESTIONS.id);
    expect(copy).not.toBe(getExperienceCopy(undefined));
    expect(copy.inviteText("Robin")).toContain("Robin");
    expect(copy.answerText("Robin")).toContain("Robin");
    const all = [
      copy.builderIntro,
      copy.inviteHeading,
      copy.inviteText("Robin"),
      copy.answerHeading,
      copy.answerText("Robin"),
      copy.finalText,
      copy.finalizeButtonLabel,
    ].join(" ");
    expect(all).not.toMatch(/score|percent|compatib|align|wavelength/i);
  });
});
