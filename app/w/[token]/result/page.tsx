import { redirect } from "next/navigation";

import { ResultReveal } from "@/components/result/result-reveal";
import { ResultView } from "@/components/result/result-view";
import { requireUserId } from "@/lib/supabase/identity";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildWavelengthResultView, ResultDataError } from "@/lib/wavelength/result";

/**
 * The shared result (ARCHITECTURE.md §12 Phase 6) — only ever computed
 * here, from Questions + Answers via lib/scoring/score.ts, never persisted
 * (§10: no results table).
 *
 * Authorization, same pattern as every other page under app/w/[token]/:
 * an RLS-scoped direct SELECT on `wavelengths` by share_token, which only
 * returns a row at all if the caller is already a participant (A or B).
 * The share token alone never grants access — a non-participant holding
 * only the link gets a generic "not available" message here, the same as
 * for a nonexistent token, so a failed attempt can't be used to tell the
 * two apart. Once we know the caller is a participant, `answers_select`'s
 * COMPLETED clause is what actually allows reading *both* sides' answers
 * (before COMPLETED, that same query would silently return only the
 * caller's own rows — this page just never runs for a non-COMPLETED
 * wavelength in the first place, see below).
 */
export default async function ResultPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await requireUserId();
  const supabase = await createSupabaseServerClient();

  const { data: wavelength } = await supabase
    .from("wavelengths")
    .select("id, state")
    .eq("share_token", token)
    .maybeSingle();

  if (!wavelength) {
    return (
      <main>
        <h1>Result not available</h1>
        <p>This link either doesn&apos;t exist, or you&apos;re not one of its two participants.</p>
      </main>
    );
  }

  if (wavelength.state !== "COMPLETED") {
    // Not finished yet — let /w/[token] route to whatever *is* the right
    // view for this participant right now (share view, answering flow…).
    redirect(`/w/${token}`);
  }

  const [{ data: questions }, { data: answers }] = await Promise.all([
    supabase
      .from("questions")
      .select("id, category, type, text, options, order_index")
      .eq("wavelength_id", wavelength.id)
      .order("order_index", { ascending: true }),
    supabase
      .from("answers")
      .select("question_id, participant, value")
      .eq("wavelength_id", wavelength.id),
  ]);

  let view;
  try {
    view = buildWavelengthResultView(questions ?? [], answers ?? []);
  } catch (err) {
    // Should be unreachable for a genuinely COMPLETED wavelength (the state
    // trigger guarantees every question has both participants' valid
    // answers before allowing that transition) — fail safely rather than
    // leak a raw error or partial data if it somehow isn't.
    const isKnown = err instanceof ResultDataError;
    return (
      <main>
        <h1>Something went wrong</h1>
        <p>We couldn&apos;t put your result together right now. Please try again in a moment.</p>
        {!isKnown && (
          // Truly unexpected (not even our own typed error) — nothing
          // participant- or answer-specific is in this message either way.
          <p>If this keeps happening, that&apos;s a bug, not something you did.</p>
        )}
      </main>
    );
  }

  return (
    <main>
      <ResultReveal>
        <ResultView view={view} />
      </ResultReveal>
    </main>
  );
}
