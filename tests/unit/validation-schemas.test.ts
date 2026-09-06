import { describe, expect, it } from "vitest";

import {
  aliasSchema,
  answerValueSchema,
  isDuplicateQuestionText,
  normalizeText,
  optionsSchema,
  parseAlias,
  parseAnswerValue,
  parseQuestionInput,
  questionInputSchema,
  questionTextSchema,
} from "../../lib/validation/schemas";

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

  it("rejects 'situation' — removed from the MVP", () => {
    const result = questionInputSchema.safeParse({
      type: "situation",
      category: "relationship",
      text: "Weekend plans?",
      options: ["Stay in", "Go out"],
    });
    expect(result.success).toBe(false);
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
  it("accepts every value in the fixed 0/25/50/75/100 scale domain", () => {
    const schema = answerValueSchema({ type: "scale" });
    for (const v of [0, 25, 50, 75, 100]) {
      expect(schema.safeParse(v).success).toBe(true);
    }
  });

  it("rejects values outside the fixed scale domain, including the old 1-5 index", () => {
    const schema = answerValueSchema({ type: "scale" });
    for (const v of [1, 2, 3, 4, 5, -1, 10, 99]) {
      expect(schema.safeParse(v).success).toBe(false);
    }
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

  it("parseAnswerValue reads a scale value from the 0/25/50/75/100 domain", () => {
    const fd = new FormData();
    fd.set("value", "75");
    const result = parseAnswerValue(fd, { type: "scale" });
    expect(result).toEqual({ success: true, data: 75 });
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

describe("aliasSchema (mirrors the DB's is_valid_alias exactly — Phase 1 security clarification)", () => {
  it("accepts a normal name", () => {
    expect(aliasSchema.safeParse("Alex").success).toBe(true);
  });

  it("rejects an empty or all-whitespace alias", () => {
    expect(aliasSchema.safeParse("").success).toBe(false);
    expect(aliasSchema.safeParse("   ").success).toBe(false);
  });

  it("trims before validating and storing", () => {
    const result = aliasSchema.safeParse("  Alex  ");
    expect(result).toEqual({ success: true, data: "Alex" });
  });

  it("accepts the 60-character boundary and rejects 61", () => {
    expect(aliasSchema.safeParse("a".repeat(60)).success).toBe(true);
    expect(aliasSchema.safeParse("a".repeat(61)).success).toBe(false);
  });

  it("is not ASCII-only — full Unicode is allowed (accents, non-Latin scripts, emoji)", () => {
    expect(aliasSchema.safeParse("Renée").success).toBe(true);
    expect(aliasSchema.safeParse("안녕").success).toBe(true);
    expect(aliasSchema.safeParse("こんにちは").success).toBe(true);
    expect(aliasSchema.safeParse("🙂 Alex 🙂").success).toBe(true);
  });

  it("rejects ASCII control characters embedded in the name (not just leading/trailing whitespace, which .trim() already strips)", () => {
    expect(aliasSchema.safeParse("Alex" + String.fromCharCode(0) + "Bailey").success).toBe(false); // null byte
    expect(aliasSchema.safeParse("Alex\nBailey").success).toBe(false); // newline
    expect(aliasSchema.safeParse("Alex" + String.fromCharCode(127) + "Bailey").success).toBe(false); // DEL
  });
});

describe("parseAlias", () => {
  it("reads and validates the 'alias' field by default", () => {
    const fd = new FormData();
    fd.set("alias", "Bailey");
    expect(parseAlias(fd)).toEqual({ success: true, data: "Bailey" });
  });

  it("supports reading a differently-named field", () => {
    const fd = new FormData();
    fd.set("displayName", "Bailey");
    expect(parseAlias(fd, "displayName")).toEqual({ success: true, data: "Bailey" });
  });

  it("returns a friendly error for a missing alias", () => {
    const fd = new FormData();
    const result = parseAlias(fd);
    expect(result.success).toBe(false);
  });
});
