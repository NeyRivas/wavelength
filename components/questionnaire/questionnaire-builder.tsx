import { FinalizeForm } from "./finalize-form";
import { QuestionAddForm } from "./question-add-form";
import { QuestionCard } from "./question-card";
import type { QuestionRow } from "./types";
import {
  MAX_QUESTIONS,
  MIN_QUESTIONS,
  RECOMMENDED_QUESTION_COUNT,
} from "@/lib/wavelength/categories";

/**
 * Progressive creation (resolved decision): there is no pre-declared
 * question count or category set to check against. A can add questions one
 * at a time, in any category, until reaching MAX_QUESTIONS; finalizing only
 * requires having reached MIN_QUESTIONS and answered every question so far.
 * RECOMMENDED_QUESTION_COUNT is shown as a soft note only, never enforced.
 *
 * QA fix: no "Category balance" indicator of any kind — A gets no signal at
 * all about how questions are distributed across categories, and nothing
 * here limits or nudges that distribution. Categories still live entirely
 * on each question (chosen individually) and are used wherever needed in
 * results; there's just no UI surfacing a tally of them during creation.
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
    <div>
      <p>
        {questions.length} question{questions.length === 1 ? "" : "s"} created · {answeredCount} of{" "}
        {questions.length} answered
        <br />
        Minimum {MIN_QUESTIONS}, maximum {MAX_QUESTIONS} — {RECOMMENDED_QUESTION_COUNT} is just a
        friendly recommendation, not a requirement.
      </p>

      <ol>
        {questions.map((question, index) => (
          <li key={question.id}>
            <QuestionCard
              wavelengthId={wavelength.id}
              question={question}
              answerValue={answerByQuestion.get(question.id)}
              isFirst={index === 0}
              isLast={index === questions.length - 1}
            />
          </li>
        ))}
      </ol>

      {atMax ? (
        <p>
          You&apos;ve reached the maximum of {MAX_QUESTIONS} questions. Delete one first if you want
          to add a different one.
        </p>
      ) : (
        <QuestionAddForm wavelengthId={wavelength.id} />
      )}

      {canFinalize ? (
        <FinalizeForm wavelengthId={wavelength.id} shareToken={wavelength.share_token} />
      ) : (
        questions.length > 0 && (
          <p>
            {questions.length < MIN_QUESTIONS
              ? `Add at least ${MIN_QUESTIONS - questions.length} more question${
                  MIN_QUESTIONS - questions.length === 1 ? "" : "s"
                } to be able to finalize.`
              : "Answer every question to create your Wavelength."}
          </p>
        )
      )}
    </div>
  );
}
