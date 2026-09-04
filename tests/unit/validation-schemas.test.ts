import { describe, expect, it } from "vitest";

import {
  answerValueSchema,
  categoriesSchema,
  createDraftInputSchema,
  isDuplicateQuestionText,
  normalizeText,
  optionsSchema,
  parseAnswerValue,
  parseCreateDraftInput,
  parseQuestionInput,
  questionCountSchema,
  questionInputSchema,
  questionTextSchema,
} from "../../lib/validation/schemas";

describe("questionCountSchema", () => {
  it("accepts the full 5-12 range", () => {
    for (const n of [5, 6, 8, 11, 12]) {
      expect(questionCountSchema.safeParse(n).success).toBe(true);
    }
  });

  it("rejects just outside the range", () => {
    expect(questionCountSchema.safeParse(4).success).toBe(false);
    expect(questionCountSchema.safeParse(13).success).toBe(false);
  });

  it("rejects a non-integer", () => {
    expect(questionCountSchema.safeParse(8.5).success).toBe(false);
  });
});

describe("categoriesSchema: capped by question count (resolved decision §13.A)", () => {
  it("allows up to the full 6 once question count reaches 6", () => {
    const schema = categoriesSchema(6);
    expect(
      schema.safeParse([
        "relationship",
        "lifestyle",
        "money",
        "adventures_travel",
        "future",
        "values_priorities",
      ]).success,
    ).toBe(true);
  });

  it("caps selectable categories at the question count when below 6", () => {
    const schema = categoriesSchema(3);
    expect(schema.safeParse(["relationship", "lifestyle", "money"]).success).toBe(true);
    expect(schema.safeParse(["relationship", "lifestyle", "money", "future"]).success).toBe(false);
  });

  it("requires at least 1 category", () => {
    expect(categoriesSchema(8).safeParse([]).success).toBe(false);
  });

  it("rejects a duplicate category", () => {
    expect(categoriesSchema(8).safeParse(["relationship", "relationship"]).success).toBe(false);
  });
});

describe("createDraftInputSchema", () => {
  it("accepts a valid combination", () => {
    const result = createDraftInputSchema.safeParse({
      questionCount: 5,
      categories: ["relationship", "lifestyle"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects more categories than the question count allows, even though each field is individually valid", () => {
    const result = createDraftInputSchema.safeParse({
      questionCount: 5,
      categories: [
        "relationship",
        "lifestyle",
        "money",
        "future",
        "values_priorities",
        "adventures_travel",
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe("questionTextSchema", () => {
  it("rejects text shorter than 3 characters", () => {
    expect(questionTextSchema.safeParse("Hi").success).toBe(false);
  });

  it("accepts text at the boundaries (3 and 300 characters)", () => {
    expect(questionTextSchema.safeParse("Hi!").success).toBe(true);
    expect(questionTextSchema.safeParse("x".repeat(300)).success).toBe(true);
    expect(questionTextSchema.safeParse("x".repeat(301)).success).toBe(false);
  });

  it("trims before measuring length", () => {
    expect(questionTextSchema.safeParse("  Hi!  ").success).toBe(true);
  });
});

describe("optionsSchema", () => {
  it("rejects fewer than 2 options", () => {
    expect(optionsSchema.safeParse(["only one"]).success).toBe(false);
  });

  it("accepts 2 through 5 options", () => {
    expect(optionsSchema.safeParse(["a", "b"]).success).toBe(true);
    expect(optionsSchema.safeParse(["a", "b", "c", "d", "e"]).success).toBe(true);
  });

  it("rejects more than 5 options", () => {
    expect(optionsSchema.safeParse(["a", "b", "c", "d", "e", "f"]).success).toBe(false);
  });

  it("rejects an empty option", () => {
    expect(optionsSchema.safeParse(["a", ""]).success).toBe(false);
  });

  it("rejects duplicate options, ignoring case and surrounding whitespace", () => {
    expect(optionsSchema.safeParse(["Yes", "yes"]).success).toBe(false);
    expect(optionsSchema.safeParse(["Yes", "  Yes  "]).success).toBe(false);
  });
});

describe("questionInputSchema", () => {
  it("requires options for a choice question", () => {
    const result = questionInputSchema.safeParse({
      type: "choice",
      category: "relationship",
      text: "Weekend plans?",
      options: ["Stay in", "Go out"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a choice question with no options", () => {
    const result = questionInputSchema.safeParse({
      type: "choice",
      category: "relationship",
      text: "Weekend plans?",
      options: [],
    });
    expect(result.success).toBe(false);
  });

  it("accepts a scale question without options", () => {
    const result = questionInputSchema.safeParse({
      type: "scale",
      category: "future",
      text: "Importance of routine",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown type", () => {
    const result = questionInputSchema.safeParse({
      type: "essay",
      category: "future",
      text: "Tell me about yourself",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown category", () => {
    const result = questionInputSchema.safeParse({
      type: "scale",
      category: "astrology",
      text: "Importance of routine",
    });
    expect(result.success).toBe(false);
  });
});

describe("answerValueSchema", () => {
  it("accepts 1-5 for a scale question", () => {
    const schema = answerValueSchema({ type: "scale" });
    for (const v of [1, 2, 3, 4, 5]) {
      expect(schema.safeParse(v).success).toBe(true);
    }
  });

  it("rejects 0 and 6 for a scale question", () => {
    const schema = answerValueSchema({ type: "scale" });
    expect(schema.safeParse(0).success).toBe(false);
    expect(schema.safeParse(6).success).toBe(false);
  });

  it("accepts 0..optionCount-1 for a choice question", () => {
    const schema = answerValueSchema({ type: "choice", optionCount: 3 });
    expect(schema.safeParse(0).success).toBe(true);
    expect(schema.safeParse(2).success).toBe(true);
    expect(schema.safeParse(3).success).toBe(false);
    expect(schema.safeParse(-1).success).toBe(false);
  });
});

describe("normalizeText / isDuplicateQuestionText", () => {
  it("normalizes by trimming and lowercasing", () => {
    expect(normalizeText("  Same Question  ")).toBe("same question");
  });

  it("detects a duplicate regardless of case/whitespace", () => {
    expect(isDuplicateQuestionText(["Same Question"], "  same question  ")).toBe(true);
  });

  it("does not flag genuinely different text", () => {
    expect(isDuplicateQuestionText(["Some question"], "A different question")).toBe(false);
  });
});

describe("FormData parsing helpers", () => {
  it("parseCreateDraftInput reads a number field and repeated checkbox values", () => {
    const fd = new FormData();
    fd.set("questionCount", "5");
    fd.append("categories", "relationship");
    fd.append("categories", "lifestyle");

    const result = parseCreateDraftInput(fd);
    expect(result).toEqual({
      success: true,
      data: { questionCount: 5, categories: ["relationship", "lifestyle"] },
    });
  });

  it("parseCreateDraftInput returns a friendly error for an invalid combination", () => {
    const fd = new FormData();
    fd.set("questionCount", "5");
    for (const c of [
      "relationship",
      "lifestyle",
      "money",
      "future",
      "values_priorities",
      "adventures_travel",
    ]) {
      fd.append("categories", c);
    }
    const result = parseCreateDraftInput(fd);
    expect(result.success).toBe(false);
  });

  it("parseQuestionInput drops blank option rows before validating", () => {
    const fd = new FormData();
    fd.set("type", "choice");
    fd.set("category", "relationship");
    fd.set("text", "Weekend plans?");
    fd.append("options", "Stay in");
    fd.append("options", "");
    fd.append("options", "Go out");

    const result = parseQuestionInput(fd);
    expect(result).toEqual({
      success: true,
      data: {
        type: "choice",
        category: "relationship",
        text: "Weekend plans?",
        options: ["Stay in", "Go out"],
      },
    });
  });

  it("parseQuestionInput handles a scale question with no options field at all", () => {
    const fd = new FormData();
    fd.set("type", "scale");
    fd.set("category", "future");
    fd.set("text", "Importance of routine");

    const result = parseQuestionInput(fd);
    expect(result.success).toBe(true);
  });

  it("parseAnswerValue reads and validates a numeric field", () => {
    const fd = new FormData();
    fd.set("value", "2");
    const result = parseAnswerValue(fd, { type: "choice", optionCount: 3 });
    expect(result).toEqual({ success: true, data: 2 });
  });

  it("parseAnswerValue rejects an out-of-range value", () => {
    const fd = new FormData();
    fd.set("value", "5");
    const result = parseAnswerValue(fd, { type: "choice", optionCount: 3 });
    expect(result.success).toBe(false);
  });

  it("parseAnswerValue rejects a non-numeric value", () => {
    const fd = new FormData();
    fd.set("value", "not-a-number");
    const result = parseAnswerValue(fd, { type: "scale" });
    expect(result.success).toBe(false);
  });
});
