import type { Category, QuestionType } from "@/lib/wavelength/categories";

export interface QuestionRow {
  id: string;
  category: Category;
  type: QuestionType;
  text: string;
  options: string[] | null;
  order_index: number;
  /** Optional: only fetched/used by /create's builder, to assign each
   * question a stable tint by creation order (see assignQuestionTints,
   * category-visuals.ts) that survives reordering. Every other screen
   * (B's answer page, read-only review) never selects this column and
   * keeps deriving its tint from position instead, since their question
   * order is permanently frozen. */
  created_at?: string;
}
