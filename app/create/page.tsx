import { Fraunces, Nunito_Sans } from "next/font/google";

import { CreateHeader } from "@/components/questionnaire/create-header";
import { CreateProgress } from "@/components/questionnaire/create-progress";
import { DraftSetupForm } from "@/components/questionnaire/draft-setup-form";
import { QuestionnaireBackground } from "@/components/questionnaire/questionnaire-background";
import { QuestionnaireBuilder } from "@/components/questionnaire/questionnaire-builder";
import { requireUserId } from "@/lib/supabase/identity";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getExperienceCopy } from "@/lib/wavelength/experience-copy";
import { getReadyMadeGame, READY_MADE_GAMES } from "@/lib/wavelength/ready-made-games";

const MAKE_YOUR_OWN_HEADING = "Make Your Own";
const MAKE_YOUR_OWN_SUBTITLE = "Create your own relationship quiz with questions that matter.";

// Precomputed once: the exact question-text set for each ready-made game
// that has real questions — used only below, to recognize "this draft's
// content is a ready-made game's" when resolving which draft Make Your
// Own should resume. Never used to decide which *ready-made* draft to
// show (that's the `game` query param + the scoped source_game_id lookup
// right below, both unchanged from the existing draft-separation fix).
const READY_MADE_TEXT_SETS = READY_MADE_GAMES.filter((game) => game.questions).map(
  (game) => new Set(game.questions!.map((question) => question.text)),
);

function looksLikeReadyMadeDraft(questionTexts: string[]): boolean {
  if (questionTexts.length === 0) return false;
  return READY_MADE_TEXT_SETS.some(
    (textSet) =>
      questionTexts.length === textSet.size && questionTexts.every((text) => textSet.has(text)),
  );
}

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

function CreateShellIntro({
  heading,
  subtitle,
  intro,
  questionCount,
}: {
  heading: string;
  subtitle: string;
  intro: string;
  questionCount: number;
}) {
  return (
    <div className="create-shell__intro">
      <h1 className="create-shell__heading">{heading}</h1>
      <p className="create-shell__text">{subtitle}</p>
      <p className="create-shell__description">{intro}</p>
      <CreateProgress current={questionCount} />
    </div>
  );
}

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string }>;
}) {
  const userId = await requireUserId();
  const supabase = await createSupabaseServerClient();
  const { game: gameId } = await searchParams;

  // Which ready-made game (if any) was just picked, straight from the
  // query param app/actions/ready-made-games.ts always attaches on its
  // redirect — fresh seed or resume alike, so this is reliable regardless
  // of source_game_id's own persistence. Drives the heading/subtitle/
  // "← Back" below directly; it has nothing to do with *which draft's
  // questions* load (that's the scoped source_game_id lookup right below,
  // completely unchanged from the existing draft-separation fix).
  const resolvedGame = gameId ? getReadyMadeGame(gameId) : undefined;
  const heading = resolvedGame?.title || MAKE_YOUR_OWN_HEADING;
  const subtitle = resolvedGame?.builderSubtitle || MAKE_YOUR_OWN_SUBTITLE;
  const experienceCopy = getExperienceCopy(gameId);
  const backHref =
    resolvedGame?.group === "dating-couples"
      ? "/play/dating-couples"
      : resolvedGame?.group === "friends"
        ? "/play/friends"
        : "/play";

  // A given account can have more than one concurrent DRAFT (one per
  // ready-made game — see app/actions/ready-made-games.ts). With a `game`
  // param, resume that game's own draft specifically.
  let draft: { id: string; share_token: string } | null = null;

  if (gameId) {
    const { data } = await supabase
      .from("wavelengths")
      .select("id, share_token")
      .eq("participant_a_id", userId)
      .eq("state", "DRAFT")
      .eq("source_game_id", gameId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    draft = data ?? null;
  } else {
    // Make Your Own / direct navigation: must never resume a ready-made
    // game's draft here. source_game_id can't reliably tell them apart at
    // the database level, so check each of the account's most recent
    // drafts' actual question content against the known ready-made sets,
    // and resume the first one that doesn't match. An account with only
    // ready-made drafts (or none at all) falls through to the empty
    // DraftSetupForm below, exactly as intended.
    const { data: candidates } = await supabase
      .from("wavelengths")
      .select("id, share_token")
      .eq("participant_a_id", userId)
      .eq("state", "DRAFT")
      .order("created_at", { ascending: false })
      .limit(10);

    for (const candidate of candidates ?? []) {
      const { data: candidateQuestions } = await supabase
        .from("questions")
        .select("text")
        .eq("wavelength_id", candidate.id);
      if (!looksLikeReadyMadeDraft((candidateQuestions ?? []).map((question) => question.text))) {
        draft = candidate;
        break;
      }
    }
  }

  if (!draft) {
    return (
      <div className={`${fraunces.variable} ${nunitoSans.variable} wl-create`}>
        <QuestionnaireBackground />
        <CreateHeader backHref={backHref} />
        <main className="create-shell">
          <CreateShellIntro
            heading={heading}
            subtitle={subtitle}
            intro={experienceCopy.builderIntro}
            questionCount={0}
          />
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
      <QuestionnaireBackground />
      <CreateHeader backHref={backHref} />
      <main className="create-shell">
        <CreateShellIntro
          heading={heading}
          subtitle={subtitle}
          intro={experienceCopy.builderIntro}
          questionCount={questions?.length ?? 0}
        />
        <QuestionnaireBuilder
          wavelength={draft}
          questions={questions ?? []}
          answers={answers ?? []}
          finalizeButtonLabel={experienceCopy.finalizeButtonLabel}
        />
      </main>
    </div>
  );
}
