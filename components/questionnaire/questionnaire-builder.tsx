import { AnimatedQuestionList } from "./animated-question-list";
import { FinalizeForm } from "./finalize-form";
import { QuestionAddForm } from "./question-add-form";
import { QuestionCard } from "./question-card";
import type { QuestionRow } from "./types";
import { MAX_QUESTIONS, MIN_QUESTIONS } from "@/lib/wavelength/categories";

/**
 * Progressive creation (resolved decision): there is no pre-declared
 * question count or category set to check against. A can add questions one
 * at a time, in any category, until reaching MAX_QUESTIONS; finalizing only
 * requires having reached MIN_QUESTIONS and answered every question so far.
 * 8 is a recommended count elsewhere in the product's thinking, but never
 * shown here as a target — this component only ever talks in terms of the
 * 5-12 range and what's actually been created so far.
 *
 * QA fix: no "Category balance" indicator of any kind — A gets no signal at
 * all about how questions are distributed across categories, and nothing
 * here limits or nudges that distribution. Categories still live entirely
 * on each question (chosen individually) and are used wherever needed in
 * results; there's just no UI surfacing a tally of them during creation.
 *
 * Presentation (Figma reference): the old narrative "N questions added so
 * far…" paragraph is gone — app/create/page.tsx's shared CreateProgress
 * readout now covers that same information as one bar + count, so this
 * component only surfaces the two states that readout can't: "you're at
 * the max" (which also hides the add-question card) and "you still need
 * to answer everything" (shown once MIN_QUESTIONS is reached but not
 * every question has A's answer yet). All of the underlying logic
 * (`answeredCount`, `atMax`, `canFinalize`) is unchanged.
 */
export function QuestionnaireBuilder({
  wavelength,
  questions,
  answers,
}: {
  wavelength: { id: string; share_token: string };
  questions: QuestionRow[];
  answers: { question_id: string; value: number }[];
}) {
  const answerByQuestion = new Map(answers.map((a) => [a.question_id, a.value]));
  const answeredCount = questions.filter((q) => answerByQuestion.has(q.id)).length;
  const atMax = questions.length >= MAX_QUESTIONS;
  const canFinalize = questions.length >= MIN_QUESTIONS && answeredCount === questions.length;

  return (
    <div className="create-builder">
      {questions.length > 0 && (
        <AnimatedQuestionList>
          {questions.map((question, index) => (
            <li key={question.id} data-flip-id={question.id}>
              <QuestionCard
                wavelengthId={wavelength.id}
                question={question}
                index={index}
                answerValue={answerByQuestion.get(question.id)}
                isFirst={index === 0}
                isLast={index === questions.length - 1}
              />
            </li>
          ))}
        </AnimatedQuestionList>
      )}

      {atMax ? (
        <p className="create-helper-note">
          You&apos;ve reached the maximum of {MAX_QUESTIONS} questions. Delete one first if you want
          to add a different one.
        </p>
      ) : (
        <QuestionAddForm wavelengthId={wavelength.id} nextIndex={questions.length} />
      )}

      {canFinalize ? (
        <FinalizeForm wavelengthId={wavelength.id} shareToken={wavelength.share_token} />
      ) : (
        questions.length >= MIN_QUESTIONS && (
          <p className="create-helper-note">Answer every question to create your Wavelength.</p>
        )
      )}
    </div>
  );
}
