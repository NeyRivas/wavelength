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
 * If A already has an in-progress DRAFT for this *specific* ready-made
 * game, this never touches or adds to it — it just resumes that draft as
 * -is, the same way navigating straight to /create always has. Seeding
 * only ever happens the first time a given game is picked, so this can't
 * silently overwrite or extend a questionnaire A is already partway
 * through. Scoped to this one game (not "any DRAFT at all") on purpose:
 * "Are we on the same page?" and "Getting to know each other" are
 * distinct experiences and must stay independently resumable, each
 * keeping its own in-progress answers, rather than all ready-made games
 * (and "Make Your Own") sharing one single global draft slot.
 */
export async function startReadyMadeGame(formData: FormData): Promise<void> {
  const gameId = String(formData.get("gameId") ?? "");
  const game = getReadyMadeGame(gameId);

  if (!game || !game.questions) {
    redirect("/create");
  }

  const userId = await requireUserId();
  const supabase = await createSupabaseServerClient();

  const { data: existingDraftForGame } = await supabase
    .from("wavelengths")
    .select("id")
    .eq("participant_a_id", userId)
    .eq("state", "DRAFT")
    .eq("source_game_id", gameId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!existingDraftForGame) {
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

      // Best-effort only: records which ready-made game seeded this draft
      // (app/create reads it for the heading/"← Back" destination). Its
      // result is intentionally ignored — if `source_game_id` isn't
      // migrated onto this database yet, this call fails harmlessly and
      // the draft + its ready-made questions above are unaffected either
      // way. This must never be folded back into the insert above: the
      // draft and its questions have to be created regardless of whether
      // this column exists.
      await supabase.from("wavelengths").update({ source_game_id: gameId }).eq("id", created.id);
    }
  }

  // Tells /create which game's draft to resume — needed now that a given
  // account can have more than one concurrent DRAFT (one per ready-made
  // game). Only used for this one redirect; /create falls back to "most
  // recent draft overall" (unchanged) when it's absent, e.g. Make Your Own.
  redirect(`/create?game=${encodeURIComponent(gameId)}`);
}
