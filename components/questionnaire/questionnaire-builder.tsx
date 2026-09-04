import { CategoryBalance } from "./category-balance";
import { QuestionAddForm } from "./question-add-form";
import { QuestionCard } from "./question-card";
import type { QuestionRow } from "./types";
import type { Category } from "@/lib/wavelength/categories";

export function QuestionnaireBuilder({
  wavelength,
  questions,
  answers,
}: {
  wavelength: { id: string; question_count: number; categories: Category[] };
  questions: QuestionRow[];
  answers: { question_id: string; value: number }[];
}) {
  const answerByQuestion = new Map(answers.map((a) => [a.question_id, a.value]));
  const answeredCount = questions.filter((q) => answerByQuestion.has(q.id)).length;
  const reachedPlannedCount = questions.length >= wavelength.question_count;

  return (
    <div>
      <p>
        {questions.length} of {wavelength.question_count} questions created · {answeredCount} of{" "}
        {questions.length} answered
      </p>

      <CategoryBalance categories={wavelength.categories} questions={questions} />

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

      {reachedPlannedCount ? (
        <p>
          You&apos;ve reached your planned question count ({wavelength.question_count}). Delete a
          question first if you want to add a different one.
        </p>
      ) : (
        <QuestionAddForm wavelengthId={wavelength.id} categories={wavelength.categories} />
      )}
    </div>
  );
}
