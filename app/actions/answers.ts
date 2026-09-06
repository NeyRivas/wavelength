"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUserId } from "@/lib/supabase/identity";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseAnswerValue } from "@/lib/validation/schemas";

import { GENERIC_ERROR, type ActionState } from "./shared";

const LOCKED_ERROR =
  "Nice try! This Wavelength is already locked, so nothing here can change anymore. 😄";

/**
 * Saves (or changes) one participant's answer to one question — an upsert,
 * since both "A can go back and change answers before finalization" and "B
 * can change their own answers before final submission" are approved
 * rules. RLS's `answers_insert`/`answers_update` policies are what actually
 * restrict this to the caller's own participant slot and the correct state
 * (A: DRAFT only; B: IN_PROGRESS only) — this shared helper's job is just
 * turning the submitted value into something valid to send. Neither
 * exported wrapper below can be used to write the *other* participant's
 * row: `participant` is hardcoded per wrapper, never read from the form.
 *
 * QA fix: checks the wavelength's actual current state *before* attempting
 * the write, rather than letting RLS reject it and surfacing a raw/generic
 * error. This matters beyond the normal page-level guard (the /answer
 * page's own "already completed" check) because this action can be reached
 * from a stale client-rendered page too — e.g. B navigates back after being
 * redirected to /result; the browser restores the already-rendered answer
 * page without the server ever re-running that guard, and the still-live
 * AnswerControl calls straight into this action on the next selection.
 */
async function saveAnswer(participant: "A" | "B", formData: FormData): Promise<ActionState> {
  const wavelengthId = String(formData.get("wavelengthId") ?? "");
  const questionId = String(formData.get("questionId") ?? "");
  if (!wavelengthId || !questionId) return { error: GENERIC_ERROR };

  await requireUserId();
  const supabase = await createSupabaseServerClient();

  const { data: wavelength } = await supabase
    .from("wavelengths")
    .select("state, share_token")
    .eq("id", wavelengthId)
    .maybeSingle();

  const expectedState = participant === "A" ? "DRAFT" : "IN_PROGRESS";
  if (!wavelength || wavelength.state !== expectedState) {
    // B specifically, once COMPLETED: send them straight to the result
    // instead of leaving them on a dead answer form — the same "you're
    // done, no cheating" destination the /answer page itself redirects to.
    if (participant === "B" && wavelength?.state === "COMPLETED") {
      redirect(`/w/${wavelength.share_token}/result`);
    }
    return { error: LOCKED_ERROR };
  }

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
      participant,
      value: parsed.data,
    },
    { onConflict: "question_id,participant" },
  );

  if (error) return { error: GENERIC_ERROR };

  if (participant === "A") {
    revalidatePath("/create");
  } else {
    // Revalidates the dynamic route pattern (every token), not one
    // concrete path — the standard Next.js approach when the param value
    // isn't readily at hand here.
    revalidatePath("/w/[token]/answer", "page");
  }

  return { error: null };
}

export async function saveAnswerA(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return saveAnswer("A", formData);
}

export async function saveAnswerB(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return saveAnswer("B", formData);
}
