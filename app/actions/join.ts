"use server";

import { redirect } from "next/navigation";

import { requireUserId } from "@/lib/supabase/identity";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseAlias } from "@/lib/validation/schemas";

import { GENERIC_ERROR, type ActionState } from "./shared";

/**
 * B claims the wavelength: WAITING -> IN_PROGRESS via the
 * `claim_participant_b` RPC — the one deliberate `SECURITY DEFINER`
 * privilege escalation in the whole schema (the caller isn't a participant
 * yet, so RLS alone can't let them find the row by token). The RPC does a
 * conditional `UPDATE ... WHERE participant_b_id IS NULL`, so only the
 * first caller to reach it actually claims the slot — a second caller (or a
 * retry after a race) gets a clear rejection here, never a silent
 * takeover. `requireUserId()` above guarantees this is a real Anonymous
 * Auth session, not a client-declared identity.
 */
export async function claimParticipantB(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { error: GENERIC_ERROR };

  const parsedAlias = parseAlias(formData);
  if (!parsedAlias.success) return { error: parsedAlias.error };

  await requireUserId();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.rpc("claim_participant_b", {
    p_token: token,
    p_alias: parsedAlias.data,
  });

  if (error) {
    // The RPC's own message ("already claimed, not found, or not ready")
    // is plain-English and safe to show — see finalizeDraft for the same
    // reasoning. It deliberately does not distinguish "wrong token" from
    // "already claimed" from "A trying to join their own wavelength" any
    // further than that, so a failed attempt doesn't leak which case applies.
    return { error: error.message };
  }

  redirect(`/w/${token}/answer`);
}

/**
 * B's final submission: IN_PROGRESS -> COMPLETED via the `submit_final_b`
 * RPC — the last of the three approved state-transition RPCs
 * (ARCHITECTURE.md §5). It re-validates everything itself regardless of
 * what this action sends: that every question has a B answer, that the
 * caller is this wavelength's B, and that it's still IN_PROGRESS (so a
 * second submission attempt — accidental double-click, browser back
 * button, replay — is rejected here rather than silently re-completing
 * something already done). On success, both participants' answers are
 * already locked by RLS (no INSERT/UPDATE policy on `answers` matches
 * outside DRAFT/IN_PROGRESS) — there is nothing else for this action to do
 * beyond redirecting to the result.
 */
export async function submitFinalB(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const wavelengthId = String(formData.get("wavelengthId") ?? "");
  const shareToken = String(formData.get("shareToken") ?? "");
  if (!wavelengthId || !shareToken) return { error: GENERIC_ERROR };

  await requireUserId();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.rpc("submit_final_b", { p_id: wavelengthId });

  if (error) {
    // Same reasoning as above: the RPC's own message ("has not answered
    // all questions (x/y)", "not found, not owned by caller, or not in
    // IN_PROGRESS state") is plain-English and safe to show directly.
    return { error: error.message };
  }

  redirect(`/w/${shareToken}/result`);
}
