"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/lib/supabase/identity";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseCreateDraftInput } from "@/lib/validation/schemas";

import { GENERIC_ERROR, type ActionState } from "./shared";

/**
 * Creates Participant A's draft Wavelength. Not a state transition (the row
 * starts life as DRAFT) so — unlike finalize_draft/claim_participant_b/
 * submit_final_b — this is a plain RLS-scoped INSERT, matching
 * ARCHITECTURE.md §5/§7. `participant_a_id` is set from the caller's own
 * verified session id; the `wavelengths_insert` RLS policy independently
 * requires it to match `auth.uid()` regardless of what this action sends,
 * so there is nothing here for a manipulated client to exploit.
 */
export async function createDraft(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseCreateDraftInput(formData);
  if (!parsed.success) {
    return { error: parsed.error };
  }

  const userId = await requireUserId();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("wavelengths").insert({
    participant_a_id: userId,
    question_count: parsed.data.questionCount,
    categories: parsed.data.categories,
  });

  if (error) {
    return { error: GENERIC_ERROR };
  }

  revalidatePath("/create");
  return { error: null };
}
