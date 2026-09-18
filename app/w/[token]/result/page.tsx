import { Fraunces, Nunito_Sans } from "next/font/google";
import { redirect } from "next/navigation";

import { CreateHeader } from "@/components/questionnaire/create-header";
import { ResultReveal } from "@/components/result/result-reveal";
import { ResultView } from "@/components/result/result-view";
import { HomeNav } from "@/components/wavelength/home-nav";
import { requireUserId } from "@/lib/supabase/identity";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildWavelengthResultView, ResultDataError } from "@/lib/wavelength/result";

/**
 * Fonts are instantiated here — same per-page pattern as app/create/page.tsx
 * and the rest of the app/w/[token]/* flow — and applied only to the real,
 * COMPLETED result view at the bottom of this file. Every earlier
 * return (not-a-participant, not-yet-COMPLETED redirect, the
 * ResultDataError fallback) is untouched, still the same bare markup as
 * before.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["400", "500", "600"],
  variable: "--font-fraunces",
  display: "swap",
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

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
 *
 * Bug-fix pass: the participant check below is an explicit, app-level
 * defense-in-depth check on top of that RLS scoping — this route returns
 * both participants' individual answers and question-level comparisons,
 * the most sensitive private data in the whole app, so it must not rely
 * on RLS being correctly configured as its *only* line of defense. If
 * `wavelength` were ever readable by a non-participant (a future RLS
 * regression), this still refuses before any question/answer data is
 * fetched at all.
 */
export default async function ResultPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const userId = await requireUserId();
  const supabase = await createSupabaseServerClient();

  const { data: wavelength } = await supabase
    .from("wavelengths")
    .select(
      "id, state, participant_a_id, participant_b_id, participant_a_alias, participant_b_alias",
    )
    .eq("share_token", token)
    .maybeSingle();

  if (
    !wavelength ||
    (wavelength.participant_a_id !== userId && wavelength.participant_b_id !== userId)
  ) {
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

  // QA fix §8.5: the clickable "Wavelength" nav (start a new one) only ever
  // appears here, and only for A — before A has seen a result, there is no
  // way to navigate away from the current flow via this element.
  const isParticipantA = wavelength.participant_a_id === userId;

  // Bug-fix pass: real participant aliases everywhere the UI shows identity
  // — never the bare "A"/"B" internal labels. Both are guaranteed non-null
  // by the time a wavelength reaches COMPLETED (finalize_draft requires
  // participant_a_alias, claim_participant_b requires participant_b_alias)
  // — the fallback strings are just defensive, never expected to render.
  const aliasA = wavelength.participant_a_alias ?? "Participant A";
  const aliasB = wavelength.participant_b_alias ?? "Participant B";

  return (
    <div className={`${fraunces.variable} ${nunitoSans.variable} wl-create`}>
      <CreateHeader />
      <main className="create-shell result-shell">
        <ResultReveal>
          {isParticipantA && <HomeNav />}
          <ResultView view={view} aliasA={aliasA} aliasB={aliasB} />
        </ResultReveal>
      </main>
    </div>
  );
}
