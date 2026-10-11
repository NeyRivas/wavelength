"use client";

import { useState } from "react";

import { saveAnswerB } from "@/app/actions/answers";

import { AnswerControl } from "./answer-control";
import { tintForIndex } from "./category-visuals";
import type { QuestionRow } from "./types";

/**
 * B's per-question answering card (app/w/[token]/answer/page.tsx). Same
 * card shell/badge/tint language QuestionCard (A's editing card) and
 * ReadOnlyAnswers (A's locked review) already established — just
 * read-only question text instead of an editable field, and a live,
 * still-interactive AnswerControl instead of a locked pill.
 * AnswerControl itself (validation, the actual save via saveAnswerB) is
 * completely unchanged; this only composes it with B-facing presentation
 * and passes its own tint through so the selected pill picks up the same
 * color as this card's badge.
 *
 * `optimisticAnswer` mirrors the exact fix QuestionCard already applies
 * for A: the head band's "Answered ✓" label is derived from the
 * server-confirmed `answerValue` prop, which only updates once
 * `saveAnswerB`'s revalidation completes a render trip later — without
 * this, the badge would visibly lag behind the pill AnswerControl already
 * updates instantly via native `:checked`. Re-synced from the real prop
 * whenever it changes for any other reason, same as QuestionCard.
 */
export function AnswerQuestionCard({
  wavelengthId,
  question,
  index,
  answerValue,
}: {
  wavelengthId: string;
  question: QuestionRow;
  index: number;
  answerValue: number | undefined;
}) {
  const [optimisticAnswer, setOptimisticAnswer] = useState(answerValue);
  const [lastSyncedAnswerValue, setLastSyncedAnswerValue] = useState(answerValue);
  if (answerValue !== lastSyncedAnswerValue) {
    setLastSyncedAnswerValue(answerValue);
    setOptimisticAnswer(answerValue);
  }

  const tint = tintForIndex(index);
  const isAnswered = optimisticAnswer !== undefined;

  return (
    <article
      className={`create-card${isAnswered ? " create-card--ready" : ""}`}
      aria-label={`Question ${index + 1}: ${question.text}`}
    >
      <header className={`create-card__head create-card__head--${tint}`}>
        <div className="create-card__badge">
          <span className={`create-card__number create-card__number--${tint}`}>{index + 1}</span>
          <span className={`create-card__title${isAnswered ? " create-card__title--ready" : ""}`}>
            {isAnswered ? "Answered ✓" : `Question ${index + 1}`}
          </span>
        </div>
      </header>

      <div className="create-card__body">
        <p className="answer-question__text">{question.text}</p>
        <AnswerControl
          action={saveAnswerB}
          wavelengthId={wavelengthId}
          question={question}
          currentValue={optimisticAnswer}
          onSelect={setOptimisticAnswer}
          tint={tint}
        />
      </div>
    </article>
  );
}
