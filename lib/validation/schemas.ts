/**
 * zod schemas mirroring the DB constraints (ARCHITECTURE.md §3/§7) — a
 * UX-quality layer only, so Server Actions can reject malformed input with
 * a clear message before making a round trip. The database (constraints,
 * triggers, RLS) remains the actual authority; nothing here is a security
 * boundary.
 */

import { z } from "zod";

import {
  CATEGORIES,
  MAX_CHOICE_OPTIONS,
  MAX_QUESTIONS,
  MIN_CHOICE_OPTIONS,
  MIN_QUESTIONS,
  QUESTION_TYPES,
  maxSelectableCategories,
  type Category,
} from "../wavelength/categories";

export const categorySchema = z.enum(CATEGORIES);
export const questionTypeSchema = z.enum(QUESTION_TYPES);

export const questionCountSchema = z
  .number()
  .int("question count must be a whole number")
  .min(MIN_QUESTIONS, `choose at least ${MIN_QUESTIONS} questions`)
  .max(MAX_QUESTIONS, `choose at most ${MAX_QUESTIONS} questions`);

/**
 * Categories: 1-6, deduplicated, and capped at `min(6, questionCount)` —
 * the resolved decision in ARCHITECTURE.md §13.A (every selected category
 * is guaranteed >=1 question). The DB's own check constraint
 * (`array_length(categories,1) <= question_count`) is the authoritative
 * backstop; this just gives a friendlier message before that round trip.
 */
export function categoriesSchema(questionCount: number) {
  const max = maxSelectableCategories(questionCount);
  return z
    .array(categorySchema)
    .min(1, "choose at least 1 category")
    .max(max, `choose at most ${max} categories for ${questionCount} questions`)
    .refine((cats) => new Set(cats).size === cats.length, {
      message: "duplicate category",
    });
}

export const createDraftInputSchema = z
  .object({
    questionCount: questionCountSchema,
    categories: z.array(categorySchema),
  })
  .superRefine((data, ctx) => {
    const result = categoriesSchema(data.questionCount).safeParse(data.categories);
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({ ...issue, path: ["categories"] });
      }
    }
  });

export type CreateDraftInput = z.infer<typeof createDraftInputSchema>;

export const questionTextSchema = z
  .string()
  .trim()
  .min(3, "question text must be at least 3 characters")
  .max(300, "question text must be at most 300 characters");

export const optionTextSchema = z
  .string()
  .trim()
  .min(1, "an option can't be empty")
  .max(200, "an option must be at most 200 characters");

export const optionsSchema = z
  .array(optionTextSchema)
  .min(MIN_CHOICE_OPTIONS, `choose at least ${MIN_CHOICE_OPTIONS} options`)
  .max(MAX_CHOICE_OPTIONS, `choose at most ${MAX_CHOICE_OPTIONS} options`)
  .refine((opts) => new Set(opts.map(normalizeText)).size === opts.length, {
    message: "options must be distinct from one another",
  });

/** choice/situation share this shape; only the literal `type` differs. */
const choiceLikeQuestionSchema = z.object({
  category: categorySchema,
  text: questionTextSchema,
  options: optionsSchema,
});

export const questionInputSchema = z.discriminatedUnion("type", [
  choiceLikeQuestionSchema.extend({ type: z.literal("choice") }),
  choiceLikeQuestionSchema.extend({ type: z.literal("situation") }),
  z.object({
    type: z.literal("scale"),
    category: categorySchema,
    text: questionTextSchema,
  }),
]);

export type QuestionInput = z.infer<typeof questionInputSchema>;

/** The value a participant can answer a given question with. */
export function answerValueSchema(question: {
  type: "choice" | "situation" | "scale";
  optionCount?: number;
}) {
  if (question.type === "scale") {
    return z.number().int().min(1).max(5);
  }
  const optionCount = question.optionCount ?? MAX_CHOICE_OPTIONS;
  return z
    .number()
    .int()
    .min(0)
    .max(optionCount - 1);
}

/** Normalizes question/option text for duplicate comparison: trim + lowercase
 * (matches the DB's `lower(btrim(text))` unique index exactly). */
export function normalizeText(text: string): string {
  return text.trim().toLowerCase();
}

export function isDuplicateQuestionText(existingTexts: string[], candidate: string): boolean {
  const normalizedCandidate = normalizeText(candidate);
  return existingTexts.some((t) => normalizeText(t) === normalizedCandidate);
}

// ── FormData parsing helpers ───────────────────────────────────────────
// Server Actions receive FormData, not JSON — these centralize the
// FormData -> typed-input step so it's the same everywhere and unit
// testable without constructing a real FormData-consuming request.

export type ParseResult<T> = { success: true; data: T } | { success: false; error: string };

function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "invalid input";
}

export function parseCreateDraftInput(formData: FormData): ParseResult<CreateDraftInput> {
  const questionCountRaw = formData.get("questionCount");
  const questionCount = Number(questionCountRaw);
  const categories = formData.getAll("categories").map(String);

  const result = createDraftInputSchema.safeParse({ questionCount, categories });
  if (!result.success) {
    return { success: false, error: firstIssueMessage(result.error) };
  }
  return { success: true, data: result.data };
}

export function parseQuestionInput(formData: FormData): ParseResult<QuestionInput> {
  const type = String(formData.get("type") ?? "");
  const category = String(formData.get("category") ?? "");
  const text = String(formData.get("text") ?? "");

  const input =
    type === "scale"
      ? { type, category, text }
      : {
          type,
          category,
          text,
          options: formData
            .getAll("options")
            .map(String)
            .filter((o) => o.trim().length > 0),
        };

  const result = questionInputSchema.safeParse(input);
  if (!result.success) {
    return { success: false, error: firstIssueMessage(result.error) };
  }
  return { success: true, data: result.data };
}

/**
 * For editing an existing question's text/options — unlike
 * `parseQuestionInput` (used for creating a question, or for the type-change
 * action), this never accepts `category` or `type`: category is immutable
 * after creation (DB-enforced, `enforce_question_category_immutable`), and
 * type changes go through `changeQuestionType` instead, which needs its own
 * options-replacement logic. `currentType` decides whether options are
 * expected at all.
 */
export function parseQuestionEditInput(
  formData: FormData,
  currentType: "choice" | "situation" | "scale",
): ParseResult<{ text: string; options?: string[] }> {
  const text = String(formData.get("text") ?? "");

  if (currentType === "scale") {
    const result = questionTextSchema.safeParse(text);
    if (!result.success) {
      return { success: false, error: firstIssueMessage(result.error) };
    }
    return { success: true, data: { text: result.data } };
  }

  const textResult = questionTextSchema.safeParse(text);
  if (!textResult.success) {
    return { success: false, error: firstIssueMessage(textResult.error) };
  }

  const options = formData
    .getAll("options")
    .map(String)
    .filter((o) => o.trim().length > 0);
  const optionsResult = optionsSchema.safeParse(options);
  if (!optionsResult.success) {
    return { success: false, error: firstIssueMessage(optionsResult.error) };
  }

  return { success: true, data: { text: textResult.data, options: optionsResult.data } };
}

export function parseAnswerValue(
  formData: FormData,
  question: { type: "choice" | "situation" | "scale"; optionCount?: number },
): ParseResult<number> {
  const raw = formData.get("value");
  const value = Number(raw);
  const result = answerValueSchema(question).safeParse(value);
  if (!result.success) {
    return { success: false, error: firstIssueMessage(result.error) };
  }
  return { success: true, data: result.data };
}

export type { Category };
