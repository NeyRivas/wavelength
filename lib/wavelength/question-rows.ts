import type { QuestionType as StoredQuestionType } from "../supabase/database.types";
import type { QuestionType } from "./categories";

/**
 * The database's question_type also includes `open` (written answers,
 * fixed conversation experiences only — see
 * lib/wavelength/conversation-experiences.ts), but every standard screen
 * (builder, B's answer cards, A's read-only review, the scored result) is
 * built for `choice`/`scale` alone. Those pages branch to the conversation
 * UI before reaching these helpers, and the database never lets an `open`
 * question into a standard wavelength — so these only narrow the rows'
 * types, and throw rather than ever pass an `open` question or a written
 * answer into the scoring/standard UI if that guarantee were broken.
 */
export function standardQuestionRows<T extends { type: StoredQuestionType }>(
  rows: T[],
): Array<T & { type: QuestionType }> {
  for (const row of rows) {
    if (row.type !== "choice" && row.type !== "scale") {
      throw new Error("an open question reached a standard questionnaire screen");
    }
  }
  return rows as Array<T & { type: QuestionType }>;
}

export function numericAnswerRows<T extends { value: number | string }>(
  rows: T[],
): Array<T & { value: number }> {
  for (const row of rows) {
    if (typeof row.value !== "number") {
      throw new Error("a written answer reached a standard questionnaire screen");
    }
  }
  return rows as Array<T & { value: number }>;
}

/** The written answers of a conversation experience, as a lookup. */
export function writtenAnswerMap(
  rows: { question_id: string; value: number | string }[],
): Map<string, string> {
  return new Map(
    rows.flatMap((row) =>
      typeof row.value === "string" ? [[row.question_id, row.value] as const] : [],
    ),
  );
}
