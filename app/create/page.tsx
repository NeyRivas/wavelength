import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";
import Link from "next/link";

import { startReadyMadeGame } from "@/app/actions/ready-made-games";
import { ConversationStepper } from "@/components/conversation/conversation-stepper";
import { CreateHeader } from "@/components/questionnaire/create-header";
import { CreateProgress } from "@/components/questionnaire/create-progress";
import { DraftSetupForm } from "@/components/questionnaire/draft-setup-form";
import { FinalizeForm } from "@/components/questionnaire/finalize-form";
import { QuestionnaireBuilder } from "@/components/questionnaire/questionnaire-builder";
import { QuizStepper } from "@/components/quiz/quiz-stepper";
import { requireUserId } from "@/lib/supabase/identity";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MIN_QUESTIONS } from "@/lib/wavelength/categories";
import {
  conversationQuestionCount,
  getConversationExperience,
  type ConversationExperience,
} from "@/lib/wavelength/conversation-experiences";
import { getExperienceCopy, type ExperienceCopy } from "@/lib/wavelength/experience-copy";
import { isPresetQuizGame, presetWritesOwnOptions } from "@/lib/wavelength/preset-quiz";
import {
  numericAnswerRows,
  standardQuestionRows,
  writtenAnswerMap,
} from "@/lib/wavelength/question-rows";
import {
  getReadyMadeGame,
  READY_MADE_GAMES,
  type ReadyMadeGame,
} from "@/lib/wavelength/ready-made-games";

// SEO pass: app/robots.ts already disallows crawling this whole path, but
// disallow alone doesn't stop a URL from being indexed (as a bare link
// with no snippet) if Google learns about it some other way — it only
// stops the crawl that would let Google see a noindex tag in the first
// place. This renders a real `<meta name="robots" content="noindex,
// nofollow">` tag for the (rare, since it's disallowed) case a crawler
// does reach this page directly. No behavior change: this route still
// requires requireUserId() below and renders a personal in-progress
// draft exactly as before.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

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

/**
 * A's side of a fixed conversation experience (resolvedGame.conversation —
 * lib/wavelength/conversation-experiences.ts): the same per-game DRAFT
 * lookup as below, but answered one question at a time in
 * ConversationStepper instead of QuestionnaireBuilder, so there is no
 * add/edit/delete/reorder UI at all (and the database rejects those
 * writes for a fixed set anyway). Finishing hands off to the unchanged
 * FinalizeForm -> finalize_draft -> share link.
 */
async function ConversationCreate({
  userId,
  experience,
  subtitle,
  copy,
  backHref,
}: {
  userId: string;
  experience: ConversationExperience;
  subtitle: string;
  copy: ExperienceCopy;
  backHref: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: draft } = await supabase
    .from("wavelengths")
    .select("id, share_token")
    .eq("participant_a_id", userId)
    .eq("state", "DRAFT")
    .eq("source_game_id", experience.id)
    .not("fixed_question_count", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const [{ data: questions }, { data: answers }] = draft
    ? await Promise.all([
        supabase
          .from("questions")
          .select("id, text, order_index")
          .eq("wavelength_id", draft.id)
          .order("order_index", { ascending: true }),
        supabase
          .from("answers")
          .select("question_id, value")
          .eq("wavelength_id", draft.id)
          .eq("participant", "A"),
      ])
    : [{ data: null }, { data: null }];
  const seeded = draft && questions?.length === conversationQuestionCount(experience);

  return (
    <div className={`${fraunces.variable} ${nunitoSans.variable} wl-create`}>
      <CreateHeader backHref={backHref} />
      <main className="create-shell conv-shell">
        <div className="create-shell__intro">
          <h1 className="create-shell__heading">{experience.title}</h1>
          <p className="create-shell__text">{subtitle}</p>
          <p className="create-shell__description">{copy.builderIntro}</p>
        </div>

        {seeded ? (
          <ConversationStepper
            experience={experience}
            participant="A"
            wavelengthId={draft.id}
            questions={questions}
            initialAnswers={Object.fromEntries(writtenAnswerMap(answers ?? []))}
            completionText="Add your name to lock in your answers. You'll get a private link to send to the person you're doing this with — they'll answer the same questions, and you'll only read each other's answers once you've both finished."
            completion={
              <FinalizeForm
                wavelengthId={draft.id}
                shareToken={draft.share_token}
                buttonLabel={copy.finalizeButtonLabel}
              />
            }
          />
        ) : (
          // No draft yet (e.g. /create?game=… opened directly), or a seed
          // that didn't complete: the same server action the landing page
          // CTA submits, which creates or re-seeds this game's draft.
          <form action={startReadyMadeGame} className="conv-start">
            <input type="hidden" name="gameId" value={experience.id} />
            <button type="submit" className="conv-button conv-button--primary">
              Start the experience <span aria-hidden="true">→</span>
            </button>
          </form>
        )}
      </main>
    </div>
  );
}

/**
 * A's side of a ready-made scored game (lib/wavelength/preset-quiz.ts):
 * the same per-game DRAFT lookup as the builder below, but played one
 * question at a time in QuizStepper instead of opening the editor. The
 * builder is still one link away ("Customize questions" →
 * /create?game=…&mode=edit) and edits the very same draft; finishing hands
 * off to the unchanged FinalizeForm -> finalize_draft -> share link.
 */
async function PresetQuizCreate({
  userId,
  game,
  copy,
  backHref,
}: {
  userId: string;
  game: ReadyMadeGame;
  copy: ExperienceCopy;
  backHref: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: draft } = await supabase
    .from("wavelengths")
    .select("id, share_token")
    .eq("participant_a_id", userId)
    .eq("state", "DRAFT")
    .eq("source_game_id", game.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const [{ data: questions }, { data: answers }] = draft
    ? await Promise.all([
        supabase
          .from("questions")
          .select("id, category, type, text, options, order_index")
          .eq("wavelength_id", draft.id)
          .order("order_index", { ascending: true }),
        supabase
          .from("answers")
          .select("question_id, value")
          .eq("wavelength_id", draft.id)
          .eq("participant", "A"),
      ])
    : [{ data: null }, { data: null }];
  const questionRows = standardQuestionRows(questions ?? []);
  const customizeHref = `/create?game=${encodeURIComponent(game.id)}&mode=edit`;

  return (
    <div className={`${fraunces.variable} ${nunitoSans.variable} wl-create`}>
      <CreateHeader backHref={backHref} />
      <main className="create-shell quiz-shell">
        <div className="create-shell__intro">
          <h1 className="create-shell__heading">{game.title}</h1>
          <p className="create-shell__text">{copy.builderIntro}</p>
        </div>

        {draft && questionRows.length > 0 ? (
          <QuizStepper
            participant="A"
            wavelengthId={draft.id}
            questions={questionRows}
            initialAnswers={Object.fromEntries(
              numericAnswerRows(answers ?? []).map((answer) => [answer.question_id, answer.value]),
            )}
            writesOwnOptions={presetWritesOwnOptions(game)}
            hint="Only you can see your answers until you've both finished."
            customizeHref={customizeHref}
            completionHeading="That's every question"
            completionText="Add your name to lock them in. You'll get a private link to send to the person you're doing this with — they'll answer the same questions on their own."
            completion={
              questionRows.length >= MIN_QUESTIONS ? (
                <FinalizeForm
                  wavelengthId={draft.id}
                  shareToken={draft.share_token}
                  buttonLabel={copy.finalizeButtonLabel}
                />
              ) : (
                <p className="create-helper-note">
                  A quiz needs at least {MIN_QUESTIONS} questions before you can share it.{" "}
                  <Link href={customizeHref} className="quiz-card__customize">
                    Add more questions
                  </Link>
                </p>
              )
            }
          />
        ) : (
          // No draft yet (e.g. /create?game=… opened directly), or a seed
          // that didn't complete: the same server action the experience
          // page's Start button submits, which creates or re-seeds it.
          <form action={startReadyMadeGame} className="conv-start">
            <input type="hidden" name="gameId" value={game.id} />
            <button type="submit" className="conv-button conv-button--primary">
              Start the quiz <span aria-hidden="true">→</span>
            </button>
          </form>
        )}
      </main>
    </div>
  );
}

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string; mode?: string }>;
}) {
  const userId = await requireUserId();
  const supabase = await createSupabaseServerClient();
  const { game: gameId, mode } = await searchParams;

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

  const conversation = resolvedGame?.conversation
    ? getConversationExperience(resolvedGame.id)
    : undefined;
  if (conversation) {
    return (
      <ConversationCreate
        userId={userId}
        experience={conversation}
        subtitle={subtitle}
        copy={experienceCopy}
        backHref={`/play/dating-couples/${conversation.id}`}
      />
    );
  }

  // Ready-made scored games are played, not built: the guided quiz unless A
  // explicitly asked for the editor ("Customize questions").
  const editingPreset = mode === "edit" && isPresetQuizGame(resolvedGame);
  if (isPresetQuizGame(resolvedGame) && !editingPreset) {
    return (
      <PresetQuizCreate
        userId={userId}
        game={resolvedGame}
        copy={experienceCopy}
        backHref={backHref}
      />
    );
  }

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
      // A fixed conversation experience's draft is never "Make Your Own".
      .is("fixed_question_count", null)
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

  if (!draft && editingPreset) {
    // Nothing to customize yet: the quiz screen offers to start this game.
    return (
      <PresetQuizCreate
        userId={userId}
        game={resolvedGame}
        copy={experienceCopy}
        backHref={backHref}
      />
    );
  }

  if (!draft) {
    return (
      <div className={`${fraunces.variable} ${nunitoSans.variable} wl-create`}>
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
      <CreateHeader backHref={backHref} />
      <main className="create-shell">
        <CreateShellIntro
          heading={heading}
          subtitle={subtitle}
          intro={experienceCopy.builderIntro}
          questionCount={questions?.length ?? 0}
        />
        {editingPreset && (
          <p className="quiz-back-to-play">
            <Link href={`/create?game=${encodeURIComponent(resolvedGame.id)}`}>
              <span aria-hidden="true">←</span> Back to the quiz
            </Link>
          </p>
        )}
        <QuestionnaireBuilder
          wavelength={draft}
          questions={standardQuestionRows(questions ?? [])}
          answers={numericAnswerRows(answers ?? [])}
          finalizeButtonLabel={experienceCopy.finalizeButtonLabel}
        />
      </main>
    </div>
  );
}
