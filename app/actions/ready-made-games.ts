"use server";

import { redirect } from "next/navigation";

import { requireUserId } from "@/lib/supabase/identity";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getReadyMadeGame } from "@/lib/wavelength/ready-made-games";

/**
 * Starts a ready-made game from the landing page's "Pick a game" section.
 * This is NOT a new game mode, participant flow, scoring system, or share
 * mechanism — it's the exact same DRAFT Wavelength that createDraft()
 * (draft.ts) creates, just pre-populated with that game's fixed question
 * list instead of starting empty. From here on it's the unmodified
 * existing flow: A answers on /create, finalizes, shares the link, B
 * answers, both see the same Result screen.
 *
 * If A already has an in-progress DRAFT (their own "Make Your Own"
 * questionnaire, or a previous ready-made game), this never touches or
 * adds to it — it just resumes that draft as-is, the same way navigating
 * straight to /create always has. Seeding only ever happens for a brand
 * new draft, so this can't silently overwrite or extend a questionnaire
 * A is already partway through.
 */
export async function startReadyMadeGame(formData: FormData): Promise<void> {
  const gameId = String(formData.get("gameId") ?? "");
  const game = getReadyMadeGame(gameId);

  if (!game || !game.questions) {
    redirect("/create");
  }

  const userId = await requireUserId();
  const supabase = await createSupabaseServerClient();

  const { data: existingDraft } = await supabase
    .from("wavelengths")
    .select("id")
    .eq("participant_a_id", userId)
    .eq("state", "DRAFT")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!existingDraft) {
    const { data: created, error } = await supabase
      .from("wavelengths")
      .insert({ participant_a_id: userId })
      .select("id")
      .single();

    if (!error && created) {
      await supabase.from("questions").insert(
        game.questions.map((question, index) => ({
          wavelength_id: created.id,
          category: question.category,
          type: question.type,
          text: question.text,
          options: question.type === "choice" ? (question.options ?? null) : null,
          order_index: index,
        })),
      );
    }
  }

  redirect("/create");
}
