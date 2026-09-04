import { redirect } from "next/navigation";

import { saveAnswerB } from "@/app/actions/answers";
import { AnswerControl } from "@/components/questionnaire/answer-control";
import { SubmitFinalForm } from "@/components/wavelength/submit-final-form";
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
 */
export default async function AnswerPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const userId = await requireUserId();
  const supabase = await createSupabaseServerClient();

  const { data: wavelength } = await supabase
    .from("wavelengths")
    .select("id, state, participant_b_id")
    .eq("share_token", token)
    .maybeSingle();

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
    <main>
      <h1>Answer the questions</h1>
      <p>
        {answeredCount} of {questionList.length} answered — you can leave and come back, and change
        any answer, any time before you submit.
      </p>
      <ol>
        {questionList.map((question) => (
          <li key={question.id}>
            <p>{question.text}</p>
            <AnswerControl
              action={saveAnswerB}
              wavelengthId={wavelength.id}
              question={question}
              currentValue={answerByQuestion.get(question.id)}
            />
          </li>
        ))}
      </ol>

      {allAnswered && <SubmitFinalForm wavelengthId={wavelength.id} shareToken={token} />}
    </main>
  );
}
