"use client";

import { useState } from "react";

import { saveAnswerA } from "@/app/actions/answers";
import { deleteQuestion, moveQuestion } from "@/app/actions/questions";

import { AnswerControl } from "./answer-control";
import { tintForId } from "./category-visuals";
import { QuestionEditForm } from "./question-edit-form";
import { TypeChangeControl } from "./type-change-control";
import type { QuestionRow } from "./types";

/**
 * One question's full editing surface: move/delete, type change, the
 * always-editable text/category/options form, and A's answer control. A
 * Client Component (see `optimisticAnswer` below for why) that composes
 * the smaller Client Components that need their own local state (type
 * selection, dynamic option rows) — move/delete are still plain
 * server-action-bound forms needing no client JS of their own, and work
 * exactly the same rendered from a Client Component.
 *
 * Presentation only (Figma reference): everything below is the same
 * composition as before — TypeChangeControl, QuestionEditForm, and
 * AnswerControl, unmodified in logic — now inside one card with a
 * full-bleed colored head band (its own tint, cycling the same 5 pastel
 * tones every card badge already used) instead of a plain bordered
 * <article>. Once A has answered ("isReady"), the head band's title
 * switches to "Ready ✓" and the card gets a stronger mint-tinted border,
 * matching the reference's completed-question treatment — purely a
 * derived-from-existing-props visual state, not a new completeness rule
 * (finalize eligibility is still computed exactly as before, in
 * questionnaire-builder.tsx).
 *
 * Bug fix: `answerValue` (the server-confirmed answer) only ever changes
 * on the next full page render, i.e. after some *other* action elsewhere
 * revalidates the page — so the "Ready ✓" banner and QuestionEditForm's
 * decorative per-option indicator used to visibly lag a click by however
 * long it took for something else to trigger a refresh. `optimisticAnswer`
 * fixes that: it starts as `answerValue`, and AnswerControl's own
 * `onSelect` updates it the instant a pill is clicked (before the save
 * request even resolves). It's re-synced to the real, server-confirmed
 * `answerValue` prop whenever that prop itself changes for any other
 * reason (a completed save confirming the same value, or the invalidation
 * trigger clearing it after a text/option edit) — done during render
 * (React's own documented pattern for "adjust state when a prop changes")
 * rather than in a `useEffect`, which would cost an extra, avoidable
 * render pass for the exact same result. AnswerControl's own actual save
 * (`saveAnswerA`, still the only thing that persists anything) is
 * completely untouched — this is purely a local mirror of its result for
 * the rest of this card to render against immediately.
 */
export function QuestionCard({
  wavelengthId,
  question,
  index,
  answerValue,
  isFirst,
  isLast,
}: {
  wavelengthId: string;
  question: QuestionRow;
  index: number;
  answerValue: number | undefined;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [optimisticAnswer, setOptimisticAnswer] = useState(answerValue);
  const [lastSyncedAnswerValue, setLastSyncedAnswerValue] = useState(answerValue);
  if (answerValue !== lastSyncedAnswerValue) {
    setLastSyncedAnswerValue(answerValue);
    setOptimisticAnswer(answerValue);
  }

  const tint = tintForId(question.id);
  const isReady = optimisticAnswer !== undefined;

  return (
    <article
      className={`create-card${isReady ? " create-card--ready" : ""}`}
      aria-label={`Question: ${question.text}`}
    >
      <header className={`create-card__head create-card__head--${tint}`}>
        <div className="create-card__badge">
          <span className={`create-card__number create-card__number--${tint}`}>{index + 1}</span>
          <span className={`create-card__title${isReady ? " create-card__title--ready" : ""}`}>
            {isReady ? "Ready ✓" : `Question ${index + 1}`}
          </span>
        </div>

        <div className="create-card__actions">
          <form action={moveQuestion}>
            <input type="hidden" name="wavelengthId" value={wavelengthId} />
            <input type="hidden" name="questionId" value={question.id} />
            <input type="hidden" name="direction" value="up" />
            <button
              type="submit"
              className="create-card__icon-btn"
              disabled={isFirst}
              aria-label="Move question up"
            >
              ↑
            </button>
          </form>
          <form action={moveQuestion}>
            <input type="hidden" name="wavelengthId" value={wavelengthId} />
            <input type="hidden" name="questionId" value={question.id} />
            <input type="hidden" name="direction" value="down" />
            <button
              type="submit"
              className="create-card__icon-btn"
              disabled={isLast}
              aria-label="Move question down"
            >
              ↓
            </button>
          </form>
          <form action={deleteQuestion}>
            <input type="hidden" name="questionId" value={question.id} />
            <button type="submit" className="create-card__delete">
              Delete
            </button>
          </form>
        </div>
      </header>

      <div className="create-card__body">
        <TypeChangeControl questionId={question.id} currentType={question.type} />
        <QuestionEditForm
          wavelengthId={wavelengthId}
          question={question}
          answerValue={optimisticAnswer}
        />
        {/* QA fix: AnswerControl's radios are uncontrolled (`defaultChecked`),
            which React only applies once, at mount — re-rendering the same
            instance with a fresh `currentValue` (e.g. after the invalidation
            trigger clears the answer server-side) never touches an
            already-mounted radio's checked state. Keying it by the exact
            fields the DB trigger watches (`text`/`options`) forces a full
            remount — fresh `defaultChecked` values from the just-revalidated
            `currentValue` — precisely when, and only when, the question was
            actually edited. A plain re-answer never changes this key (it
            doesn't touch text/options), so the existing select-and-auto-save
            flow is untouched. */}
        <AnswerControl
          key={JSON.stringify([question.text, question.options])}
          action={saveAnswerA}
          wavelengthId={wavelengthId}
          question={question}
          currentValue={optimisticAnswer}
          onSelect={setOptimisticAnswer}
        />
      </div>
    </article>
  );
}
