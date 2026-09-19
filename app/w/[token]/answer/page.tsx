import { Fraunces, Nunito_Sans } from "next/font/google";
import { redirect } from "next/navigation";

import { AnswerQuestionCard } from "@/components/questionnaire/answer-question-card";
import { CreateHeader } from "@/components/questionnaire/create-header";
import { SubmitFinalForm } from "@/components/wavelength/submit-final-form";
import { WavelengthLockedNotice } from "@/components/wavelength/wavelength-locked-notice";
import { requireUserId } from "@/lib/supabase/identity";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Participant B's answering flow (ARCHITECTURE.md §12 Phase 5). Only
 * reachable once B has claimed the wavelength and it's IN_PROGRESS —
 * anything else redirects back to /w/[token], which sorts out what to show
 * instead (join screen, "already taken", A's own view, etc.).
 *
 * This page never fetches Participant A's answers — not "fetches them and
 * hides them in the UI," genuinely never asks the database for them at
 * all, so there is nothing to leak even if this component had a bug. RLS
 * would independently block it anyway (`answers_select`: B can only read
 * their own rows before COMPLETED), but the query here doesn't rely on
 * that as the only line of defense.
 *
 * Fonts are instantiated here — same per-page pattern as app/create/page.tsx
 * and app/w/[token]/page.tsx — and now also wrap the post-completion "Nice
 * try" state below (visual redesign pass: components/wavelength/
 * wavelength-locked-notice.tsx), in addition to the live IN_PROGRESS
 * answering view. Only the markup changed — the guard's own condition and
 * the redirect below it are untouched.
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

function AnswerShellIntro({ answered, total }: { answered: number; total: number }) {
  const fraction = total > 0 ? answered / total : 0;
  return (
    <div className="create-shell__intro">
      <h1 className="create-shell__heading">Time to answer</h1>
      <p className="create-shell__text">
        Go with your gut — there are no wrong answers, and you can change any answer any time before
        you submit.
      </p>
      <div className="create-progress">
        <div
          className="create-progress__track"
          role="progressbar"
          aria-valuenow={answered}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label="Questions answered"
        >
          <div className="create-progress__fill" style={{ width: `${fraction * 100}%` }} />
        </div>
        <p className="create-progress__label">
          {answered} of {total} answered
        </p>
      </div>
    </div>
  );
}

export default async function AnswerPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const userId = await requireUserId();
  const supabase = await createSupabaseServerClient();

  const { data: wavelength } = await supabase
    .from("wavelengths")
    .select("id, state, participant_b_id")
    .eq("share_token", token)
    .maybeSingle();

  // QA fix §8.3: B trying to get back into the questions after already
  // completing (browser back button, a stale tab, a bookmarked /answer URL)
  // gets a clear, lighthearted "no cheating" message instead of a silent
  // redirect that could look like the answer might still go through.
  //
  // Bug-fix pass: this is also now the page submitFinalB's own guard sends B
  // to (see app/actions/join.ts), so it's the one, reused destination for
  // every "B, already completed" path rather than a parallel message living
  // in the action.
  //
  // Product decision: "Create your own Wavelength" is a confirm-before-
  // navigating action (components/wavelength/create-new-wavelength-
  // action.tsx), not a plain link with its own separate behavior.
  if (wavelength?.participant_b_id === userId && wavelength.state === "COMPLETED") {
    return (
      <div className={`${fraunces.variable} ${nunitoSans.variable} wl-create`}>
        <CreateHeader />
        <main className="create-shell b-locked-shell">
          <WavelengthLockedNotice shareToken={token} />
        </main>
      </div>
    );
  }

  if (!wavelength || wavelength.participant_b_id !== userId || wavelength.state !== "IN_PROGRESS") {
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
      .select("question_id, value")
      .eq("wavelength_id", wavelength.id)
      .eq("participant", "B"),
  ]);

  const answerByQuestion = new Map((answers ?? []).map((a) => [a.question_id, a.value]));
  const questionList = questions ?? [];
  const answeredCount = questionList.filter((q) => answerByQuestion.has(q.id)).length;
  const allAnswered = questionList.length > 0 && answeredCount === questionList.length;

  return (
    <div className={`${fraunces.variable} ${nunitoSans.variable} wl-create`}>
      <CreateHeader />
      <main className="create-shell answer-shell">
        <AnswerShellIntro answered={answeredCount} total={questionList.length} />

        {questionList.length > 0 && (
          <ol className="create-card-list">
            {questionList.map((question, index) => (
              <li key={question.id}>
                <AnswerQuestionCard
                  wavelengthId={wavelength.id}
                  question={question}
                  index={index}
                  answerValue={answerByQuestion.get(question.id)}
                />
              </li>
            ))}
          </ol>
        )}

        {allAnswered ? (
          <SubmitFinalForm wavelengthId={wavelength.id} shareToken={token} />
        ) : (
          questionList.length > 0 && (
            <p className="create-helper-note">Answer every question to see your results.</p>
          )
        )}
      </main>
    </div>
  );
}
