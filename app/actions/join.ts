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
