import type { Category, QuestionType } from "@/lib/wavelength/categories";

export interface QuestionRow {
  id: string;
  category: Category;
  type: QuestionType;
  text: string;
  options: string[] | null;
  order_index: number;
}
