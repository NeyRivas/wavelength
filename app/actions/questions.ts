"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/lib/supabase/identity";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MAX_QUESTIONS } from "@/lib/wavelength/categories";
import {
  isDuplicateQuestionText,
  parseQuestionEditInput,
  parseQuestionInput,
  questionTypeSchema,
} from "@/lib/validation/schemas";

import { GENERIC_ERROR, isUniqueViolationOn, type ActionState } from "./shared";

const DUPLICATE_QUESTION_ERROR = "You already have a question with this text.";
const MAX_QUESTIONS_ERROR = `A Wavelength can have at most ${MAX_QUESTIONS} questions.`;
const TEXT_UNIQUE_CONSTRAINT = "questions_wavelength_text_uidx";

type ServerSupabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/** All other questions' text in this wavelength — used for the duplicate
 * pre-check. The DB's own unique index is the authoritative backstop
 * (see isUniqueViolation below); this just gives a friendlier message in
 * the common case instead of parsing a Postgres error. */
async function siblingQuestionTexts(
  supabase: ServerSupabase,
  wavelengthId: string,
  excludeQuestionId?: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("questions")
    .select("id, text")
    .eq("wavelength_id", wavelengthId);
  return (data ?? []).filter((q) => q.id !== excludeQuestionId).map((q) => q.text);
}

/**
 * Adds a question to A's draft. Every authorization decision (this is A's
 * own wavelength, and it's still in DRAFT) is made by RLS on the INSERT
 * itself — this action only adds validation, duplicate-detection, and the
 * next order_index for UX quality.
 */
export async function addQuestion(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const wavelengthId = String(formData.get("wavelengthId") ?? "");
  if (!wavelengthId) return { error: GENERIC_ERROR };

  const parsed = parseQuestionInput(formData);
  if (!parsed.success) return { error: parsed.error };

  await requireUserId();
  const supabase = await createSupabaseServerClient();

  const siblingTexts = await siblingQuestionTexts(supabase, wavelengthId);
  if (isDuplicateQuestionText(siblingTexts, parsed.data.text)) {
    return { error: DUPLICATE_QUESTION_ERROR };
  }

  // Bug fix (QA): this used to be `count(*)`, which collides with an
  // existing row's order_index once a mid-list question has been deleted
  // (deleting never renumbers the remaining rows, so counts can land back
  // on a value still in use). That collision hit `questions_order_unique`
  // — a *different* unique constraint than the text one — but the old
  // error mapping below couldn't tell them apart, so it surfaced as the
  // wildly misleading "You already have a question with this text." Using
  // the current maximum order_index (not the count) is gap-safe: it's
  // always strictly greater than every existing row's, regardless of
  // deletions leaving gaps behind.
  const { data: existing } = await supabase
    .from("questions")
    .select("order_index")
    .eq("wavelength_id", wavelengthId);
  const existingCount = existing?.length ?? 0;

  // Friendly pre-check before the round trip; the DB's own
  // `questions_enforce_max_count` trigger is the authoritative backstop.
  if (existingCount >= MAX_QUESTIONS) {
    return { error: MAX_QUESTIONS_ERROR };
  }

  const nextOrderIndex =
    existing && existing.length > 0 ? Math.max(...existing.map((q) => q.order_index)) + 1 : 0;

  const { error } = await supabase.from("questions").insert({
    wavelength_id: wavelengthId,
    category: parsed.data.category,
    type: parsed.data.type,
    text: parsed.data.text,
    options: parsed.data.type === "scale" ? null : parsed.data.options,
    order_index: nextOrderIndex,
  });

  if (error) {
    return {
      error: isUniqueViolationOn(error, TEXT_UNIQUE_CONSTRAINT)
        ? DUPLICATE_QUESTION_ERROR
        : GENERIC_ERROR,
    };
  }

  revalidatePath("/create");
  return { error: null };
}

/**
 * Edits an existing question's text/options. Category is never accepted
 * here (immutable after creation — enforced independently by a DB trigger,
 * ARCHITECTURE.md); type changes go through `changeQuestionType` below.
 */
export async function updateQuestion(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const wavelengthId = String(formData.get("wavelengthId") ?? "");
  const questionId = String(formData.get("questionId") ?? "");
  if (!wavelengthId || !questionId) return { error: GENERIC_ERROR };

  await requireUserId();
  const supabase = await createSupabaseServerClient();

  const { data: current } = await supabase
    .from("questions")
    .select("type, text, options")
    .eq("id", questionId)
    .single();
  if (!current) return { error: GENERIC_ERROR };

  const parsed = parseQuestionEditInput(formData, current.type);
  if (!parsed.success) return { error: parsed.error };

  const siblingTexts = await siblingQuestionTexts(supabase, wavelengthId, questionId);
  if (isDuplicateQuestionText(siblingTexts, parsed.data.text)) {
    return { error: DUPLICATE_QUESTION_ERROR };
  }

  // TEMPORARY DIAGNOSTIC (QA round 4) — remove once the real-browser
  // invalidation gap is root-caused. Logs the exact before-state and, right
  // after the UPDATE, whether any `answers` row still exists for this
  // question — that second check is the one that tells us whether
  // questions_invalidate_answers_on_edit actually fired in the environment
  // the browser is pointed at, as opposed to only in the integration tests'
  // freshly-migrated local Postgres.
  const { data: answersBefore } = await supabase
    .from("answers")
    .select("id, participant, value")
    .eq("question_id", questionId);
  console.log("[QA-DIAG updateQuestion] before update", {
    questionId,
    oldText: current.text,
    newText: parsed.data.text,
    oldOptions: current.options,
    newOptions: parsed.data.options ?? null,
    answersBefore,
  });

  const { error } = await supabase
    .from("questions")
    .update({
      text: parsed.data.text,
      ...(parsed.data.options ? { options: parsed.data.options } : {}),
    })
    .eq("id", questionId);

  if (error) {
    console.log("[QA-DIAG updateQuestion] update failed", { questionId, error });
    return {
      error: isUniqueViolationOn(error, TEXT_UNIQUE_CONSTRAINT)
        ? DUPLICATE_QUESTION_ERROR
        : GENERIC_ERROR,
    };
  }

  const { data: answersAfter } = await supabase
    .from("answers")
    .select("id, participant, value")
    .eq("question_id", questionId);
  console.log("[QA-DIAG updateQuestion] after update", { questionId, answersAfter });

  revalidatePath("/create");
  return { error: null };
}

/**
 * Changes a question's type between `choice` and `scale`, preserving its
 * text and replacing options appropriately for the new type (approved
 * rule): cleared when switching to `scale`, given a minimal fresh
 * placeholder when switching to `choice` (from `scale`, which never had
 * any) — A edits it right away via the normal question form. The type
 * `<select>` itself is the only UI trigger for this (no separate confirm
 * button — see TypeChangeControl).
 */
export async function changeQuestionType(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const questionId = String(formData.get("questionId") ?? "");
  const newTypeResult = questionTypeSchema.safeParse(formData.get("type"));
  if (!questionId || !newTypeResult.success) return { error: GENERIC_ERROR };
  const newType = newTypeResult.data;

  await requireUserId();
  const supabase = await createSupabaseServerClient();

  const { data: current } = await supabase
    .from("questions")
    .select("type, options")
    .eq("id", questionId)
    .single();
  if (!current) return { error: GENERIC_ERROR };

  if (current.type === newType) {
    return { error: null };
  }

  const options = newType === "scale" ? null : (current.options ?? ["Option 1", "Option 2"]);

  const { error } = await supabase
    .from("questions")
    .update({ type: newType, options })
    .eq("id", questionId);

  if (error) return { error: GENERIC_ERROR };

  revalidatePath("/create");
  return { error: null };
}

/** Plain (no inline error feedback needed) — RLS enforces DRAFT + ownership;
 * a rejected delete just leaves the question in place after revalidation. */
export async function deleteQuestion(formData: FormData): Promise<void> {
  const questionId = String(formData.get("questionId") ?? "");
  if (!questionId) return;

  await requireUserId();
  const supabase = await createSupabaseServerClient();
  await supabase.from("questions").delete().eq("id", questionId);

  revalidatePath("/create");
}

/**
 * Moves one question up or down by swapping it with its neighbor, via the
 * `reorder_questions` RPC (atomic — see supabase/migrations — so the
 * (wavelength_id, order_index) uniqueness check never trips on the
 * intermediate state of a two-row swap).
 */
export async function moveQuestion(formData: FormData): Promise<void> {
  const wavelengthId = String(formData.get("wavelengthId") ?? "");
  const questionId = String(formData.get("questionId") ?? "");
  const direction = formData.get("direction");
  if (!wavelengthId || !questionId || (direction !== "up" && direction !== "down")) return;

  await requireUserId();
  const supabase = await createSupabaseServerClient();

  const { data: rows } = await supabase
    .from("questions")
    .select("id")
    .eq("wavelength_id", wavelengthId)
    .order("order_index", { ascending: true });

  const ids = (rows ?? []).map((r) => r.id);
  const index = ids.indexOf(questionId);
  if (index === -1) return;

  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= ids.length) return; // already at that edge

  const reordered = [...ids];
  [reordered[index], reordered[swapWith]] = [reordered[swapWith]!, reordered[index]!];

  await supabase.rpc("reorder_questions", {
    p_wavelength_id: wavelengthId,
    p_question_ids: reordered,
  });

  revalidatePath("/create");
}
