"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/lib/supabase/identity";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseAnswerValue } from "@/lib/validation/schemas";

import { GENERIC_ERROR, type ActionState } from "./shared";

/**
 * Saves (or changes) A's answer to one question — an upsert, since A can
 * "go back and change answers before finalization" (approved rule). RLS's
 * `answers_insert`/`answers_update` policies are what actually restrict
 * this to A's own DRAFT wavelength; this action's job is just turning the
 * submitted value into something valid to send.
 */
export async function saveAnswerA(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const wavelengthId = String(formData.get("wavelengthId") ?? "");
  const questionId = String(formData.get("questionId") ?? "");
  if (!wavelengthId || !questionId) return { error: GENERIC_ERROR };

  await requireUserId();
  const supabase = await createSupabaseServerClient();

  const { data: question } = await supabase
    .from("questions")
    .select("type, options")
    .eq("id", questionId)
    .single();
  if (!question) return { error: GENERIC_ERROR };

  const parsed = parseAnswerValue(formData, {
    type: question.type,
    optionCount: question.options?.length,
  });
  if (!parsed.success) return { error: parsed.error };

  const { error } = await supabase.from("answers").upsert(
    {
      wavelength_id: wavelengthId,
      question_id: questionId,
      participant: "A",
      value: parsed.data,
    },
    { onConflict: "question_id,participant" },
  );

  if (error) return { error: GENERIC_ERROR };

  revalidatePath("/create");
  return { error: null };
}
