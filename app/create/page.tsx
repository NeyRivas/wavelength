import { Fraunces, Nunito_Sans } from "next/font/google";

import { CreateHeader } from "@/components/questionnaire/create-header";
import { CreateProgress } from "@/components/questionnaire/create-progress";
import { DraftSetupForm } from "@/components/questionnaire/draft-setup-form";
import { QuestionnaireBuilder } from "@/components/questionnaire/questionnaire-builder";
import { requireUserId } from "@/lib/supabase/identity";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Participant A's DRAFT flow (ARCHITECTURE.md §12 Phase 4), now including
// finalization ("Create my Wavelength" — Phase 5). Not implemented here:
// Participant B's flow (app/w/[token]/) or the result screen (Phase 6).
//
// Data-fetching is unchanged from before the Figma-based redesign — same
// draft lookup, same questions/answers queries, same typed Supabase
// results flowing into the same two existing stage components. Only the
// returned markup changed: a shared shell (own font instantiation, own
// local CreateHeader — not the marketing LandingHeader — title/subtitle,
// and one CreateProgress readout) now wraps whichever stage applies,
// instead of each stage rendering its own bare <main>.
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

function CreateShellIntro({ questionCount }: { questionCount: number }) {
  return (
    <div className="create-shell__intro">
      <h1 className="create-shell__heading">Create your wavelength</h1>
      <p className="create-shell__text">
        Choose a few questions, answer them yourself, then invite someone to play.
      </p>
      <CreateProgress current={questionCount} />
    </div>
  );
}

export default async function CreatePage() {
  const userId = await requireUserId();
  const supabase = await createSupabaseServerClient();

  // Resume the most recent DRAFT if A already has one; otherwise show setup.
  // One active draft at a time is a Phase 4 engineering default (not a
  // product-behavior decision) — the spec describes building exactly one
  // questionnaire, and this keeps the flow simple without a draft-picker UI.
  const { data: draft } = await supabase
    .from("wavelengths")
    .select("id, share_token")
    .eq("participant_a_id", userId)
    .eq("state", "DRAFT")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!draft) {
    return (
      <div className={`${fraunces.variable} ${nunitoSans.variable} wl-create`}>
        <CreateHeader />
        <main className="create-shell">
          <CreateShellIntro questionCount={0} />
          <DraftSetupForm />
        </main>
      </div>
    );
  }

  const [{ data: questions }, { data: answers }] = await Promise.all([
    supabase
      .from("questions")
      .select("id, category, type, text, options, order_index, created_at")
      .eq("wavelength_id", draft.id)
      .order("order_index", { ascending: true }),
    supabase
      .from("answers")
      .select("question_id, value")
      .eq("wavelength_id", draft.id)
      .eq("participant", "A"),
  ]);

  return (
    <div className={`${fraunces.variable} ${nunitoSans.variable} wl-create`}>
      <CreateHeader />
      <main className="create-shell">
        <CreateShellIntro questionCount={questions?.length ?? 0} />
        <QuestionnaireBuilder
          wavelength={draft}
          questions={questions ?? []}
          answers={answers ?? []}
        />
      </main>
    </div>
  );
}
