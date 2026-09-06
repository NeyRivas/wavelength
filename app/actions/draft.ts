"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUserId } from "@/lib/supabase/identity";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseAlias } from "@/lib/validation/schemas";

import { GENERIC_ERROR, type ActionState } from "./shared";

/**
 * Creates Participant A's draft Wavelength. Not a state transition (the row
 * starts life as DRAFT) so — unlike finalize_draft/claim_participant_b/
 * submit_final_b — this is a plain RLS-scoped INSERT, matching
 * ARCHITECTURE.md §5/§7. `participant_a_id` is set from the caller's own
 * verified session id; the `wavelengths_insert` RLS policy independently
 * requires it to match `auth.uid()` regardless of what this action sends,
 * so there is nothing here for a manipulated client to exploit.
 *
 * Takes no input at all: there is no upfront question count or category
 * selection (progressive creation — resolved decision). Categories are
 * chosen per-question as A builds the questionnaire; the question count is
 * just whatever the current row count is, checked against the 5-12 range
 * only when A finalizes.
 */
export async function createDraft(
  _prevState: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("wavelengths").insert({
    participant_a_id: userId,
  });

  if (error) {
    return { error: GENERIC_ERROR };
  }

  revalidatePath("/create");
  return { error: null };
}

/**
 * Finalizes A's draft: DRAFT -> WAITING via the `finalize_draft` RPC — one
 * of the three approved state-transition RPCs (ARCHITECTURE.md §5), which
 * re-validates everything itself regardless of what this action sends: the
 * alias, that every question has an A answer, and that the question count
 * matches. After this, the questionnaire and A's answers are locked
 * (enforced by RLS — no UPDATE/INSERT policy on `questions`/`answers`
 * matches outside DRAFT state); there is no "undo" action.
 *
 * The RPC's own exception messages (alias validation, "not answered all
 * questions", etc.) are surfaced directly — they're plain-English messages
 * we authored in Phase 1 specifically to be shown to a user, not raw
 * internal errors.
 */
export async function finalizeDraft(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const wavelengthId = String(formData.get("wavelengthId") ?? "");
  const shareToken = String(formData.get("shareToken") ?? "");
  if (!wavelengthId || !shareToken) return { error: GENERIC_ERROR };

  const parsedAlias = parseAlias(formData);
  if (!parsedAlias.success) return { error: parsedAlias.error };

  await requireUserId();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.rpc("finalize_draft", {
    p_id: wavelengthId,
    p_alias: parsedAlias.data,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/create");
  redirect(`/w/${shareToken}`);
}
