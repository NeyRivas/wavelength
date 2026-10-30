"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { saveAnswerA, saveAnswerB } from "@/app/actions/answers";
import { updateQuestion } from "@/app/actions/questions";
import { initialActionState } from "@/app/actions/shared";
import { tintForIndex, type CategoryTint } from "@/components/questionnaire/category-visuals";
import {
  MAX_CHOICE_OPTIONS,
  MIN_CHOICE_OPTIONS,
  SCALE_LABELS,
  SCALE_VALUES,
  type Category,
} from "@/lib/wavelength/categories";
import {
  firstUnansweredIndex,
  needsWrittenOptions,
  prepareWrittenOptions,
  realOptions,
  sameOptions,
  type QuizQuestion,
} from "@/lib/wavelength/preset-quiz";

const SAVE_ACTIONS = { A: saveAnswerA, B: saveAnswerB } as const;

/** Long enough to see the tapped answer land, short enough not to feel
 * like waiting. */
export const ADVANCE_DELAY_MS = 300;

const SAVE_FAILED_ERROR = "We couldn't save that answer. Check your connection and try again.";

export interface QuizStepperQuestion extends QuizQuestion {
  category: Category;
}

type View = { kind: "question"; index: number } | { kind: "complete" };

/**
 * The guided quiz for ready-made scored games: one question per screen,
 * large answer buttons, and a progress bar. Used by both participants —
 * A on /create (before sharing), B on /w/[token]/answer — `participant`
 * only picks which existing Server Action saves the answer (saveAnswerA /
 * saveAnswerB, app/actions/answers.ts, where the participant slot is
 * hardcoded server-side). It can't add, remove or reorder questions; the
 * builder stays available to A behind `customizeHref`.
 *
 * Tapping an answer selects it and moves on after ADVANCE_DELAY_MS, while
 * the save runs in the background. Saves go through one queue, in the
 * order they were made, so a quick change of mind can't be overwritten by
 * an earlier, slower save. Progress only counts saved answers, a failed
 * save is reported on the question it belongs to, and `completion` (the
 * existing FinalizeForm / SubmitFinalForm) only appears once every answer
 * is confirmed saved — the database validates completeness again anyway.
 *
 * In games where A writes their own options (`writesOwnOptions`), A's
 * questions instead show answer fields plus "this is the real one", saved
 * with the builder's own updateQuestion before the answer itself.
 */
export function QuizStepper({
  participant,
  wavelengthId,
  questions,
  initialAnswers,
  writesOwnOptions = false,
  hint,
  customizeHref,
  completionHeading,
  completionText,
  completion,
}: {
  participant: "A" | "B";
  wavelengthId: string;
  /** Already in play order. */
  questions: QuizStepperQuestion[];
  initialAnswers: Record<string, number>;
  writesOwnOptions?: boolean;
  /** One line under the answers, e.g. who can see them. */
  hint: string;
  /** A only: where "Customize questions" leads (the builder). */
  customizeHref?: string;
  completionHeading: string;
  completionText: string;
  completion: React.ReactNode;
}) {
  const total = questions.length;
  const [saved, setSaved] = useState<Record<string, number>>(initialAnswers);
  const [selected, setSelected] = useState<Record<string, number>>(initialAnswers);
  const [savingCounts, setSavingCounts] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [writtenOptions, setWrittenOptions] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(questions.map((question) => [question.id, realOptions(question.options)])),
  );
  const [view, setView] = useState<View>(() => {
    const first = firstUnansweredIndex(questions, initialAnswers);
    return first === -1 ? { kind: "complete" } : { kind: "question", index: first };
  });
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isFirstRender = useRef(true);
  const saveQueue = useRef<Promise<unknown>>(Promise.resolve());
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const answeredCount = questions.filter((question) => saved[question.id] !== undefined).length;
  const isSaving = Object.keys(savingCounts).length > 0;
  const failedIndexes = questions.flatMap((question, index) =>
    errors[question.id] ? [index] : [],
  );
  const firstUnanswered = firstUnansweredIndex(questions, saved);
  const readyToFinish = answeredCount === total && !isSaving && failedIndexes.length === 0;

  // Move focus to each new step's heading so keyboard and screen-reader
  // users land on the new question instead of a stale button.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [view]);

  useEffect(() => {
    const timer = advanceTimer;
    return () => {
      if (timer.current !== null) clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (!isSaving) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isSaving]);

  function cancelAdvance() {
    if (advanceTimer.current !== null) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
  }

  function goTo(next: View) {
    cancelAdvance();
    setView(next);
  }

  function viewAfter(index: number): View {
    return index + 1 < total ? { kind: "question", index: index + 1 } : { kind: "complete" };
  }

  function setError(questionId: string, message: string | null) {
    setErrors((current) => {
      const next = { ...current };
      if (message) next[questionId] = message;
      else delete next[questionId];
      return next;
    });
  }

  /** Runs `task` after every save queued before it, and counts it as
   * in-flight for `questionId` until it settles. */
  function queueSave(questionId: string, task: () => Promise<boolean>): Promise<boolean> {
    setSavingCounts((current) => ({ ...current, [questionId]: (current[questionId] ?? 0) + 1 }));
    const run = saveQueue.current.then(task, task);
    saveQueue.current = run.catch(() => undefined);
    return run
      .catch(() => {
        setError(questionId, SAVE_FAILED_ERROR);
        return false;
      })
      .finally(() =>
        setSavingCounts((current) => {
          const next = { ...current };
          const remaining = (next[questionId] ?? 1) - 1;
          if (remaining > 0) next[questionId] = remaining;
          else delete next[questionId];
          return next;
        }),
      );
  }

  async function saveAnswer(questionId: string, value: number): Promise<boolean> {
    const formData = new FormData();
    formData.set("wavelengthId", wavelengthId);
    formData.set("questionId", questionId);
    formData.set("value", String(value));
    const result = await SAVE_ACTIONS[participant](initialActionState, formData);
    // No result when the action redirected instead (B saving after the
    // questionnaire was already completed elsewhere): the router is
    // already navigating to the result, so there's nothing to show here.
    if (!result) return false;
    if (result.error) {
      setError(questionId, result.error);
      return false;
    }
    setSaved((current) => ({ ...current, [questionId]: value }));
    setError(questionId, null);
    return true;
  }

  function choose(index: number, value: number) {
    const question = questions[index]!;
    setSelected((current) => ({ ...current, [question.id]: value }));
    setError(question.id, null);
    // Skip the round trip only when this is already the saved answer and
    // nothing else is on its way for this question (a quick change of mind
    // back to the saved answer must still overwrite the pending one).
    if (saved[question.id] !== value || (savingCounts[question.id] ?? 0) > 0) {
      void queueSave(question.id, () => saveAnswer(question.id, value));
    }
    cancelAdvance();
    advanceTimer.current = setTimeout(() => {
      advanceTimer.current = null;
      setView(viewAfter(index));
    }, ADVANCE_DELAY_MS);
  }

  async function submitWrittenOptions(index: number, slots: string[], correctSlot: number | null) {
    const question = questions[index]!;
    const prepared = prepareWrittenOptions(slots, correctSlot);
    if (!prepared.ok) {
      setError(question.id, prepared.error);
      return;
    }
    setError(question.id, null);

    const ok = await queueSave(question.id, async () => {
      if (!sameOptions(prepared.options, writtenOptions[question.id] ?? [])) {
        const formData = new FormData();
        formData.set("wavelengthId", wavelengthId);
        formData.set("questionId", question.id);
        formData.set("text", question.text);
        formData.set("category", question.category);
        for (const option of prepared.options) formData.append("options", option);
        const result = await updateQuestion(initialActionState, formData);
        if (result.error) {
          setError(question.id, result.error);
          return false;
        }
        setWrittenOptions((current) => ({ ...current, [question.id]: prepared.options }));
        // Changing options can clear or move the saved answer
        // (questions_invalidate_answers_on_edit), so it only counts again
        // once the save below confirms it.
        setSaved((current) => {
          const next = { ...current };
          delete next[question.id];
          return next;
        });
      }
      return saveAnswer(question.id, prepared.answerIndex);
    });

    if (ok) {
      setSelected((current) => ({ ...current, [question.id]: prepared.answerIndex }));
      goTo(viewAfter(index));
    }
  }

  let currentStep: React.ReactNode = null;
  if (view.kind === "question") {
    const index = view.index;
    const question = questions[index]!;
    const shared = {
      index,
      total,
      question,
      tint: tintForIndex(index),
      headingRef,
      hint,
      customizeHref,
      saving: (savingCounts[question.id] ?? 0) > 0,
      error: errors[question.id] ?? null,
      onPrevious: index > 0 ? () => goTo({ kind: "question", index: index - 1 }) : undefined,
    };
    currentStep =
      participant === "A" && needsWrittenOptions(question, writesOwnOptions) ? (
        <WrittenOptionsStep
          key={question.id}
          {...shared}
          initialOptions={writtenOptions[question.id] ?? []}
          initialCorrect={saved[question.id] ?? null}
          onSubmit={(slots, correctSlot) => submitWrittenOptions(index, slots, correctSlot)}
          onEdit={() => {
            if (errors[question.id]) setError(question.id, null);
          }}
        />
      ) : (
        <ChoiceStep
          key={question.id}
          {...shared}
          value={selected[question.id]}
          onChoose={(value) => choose(index, value)}
          onNext={selected[question.id] !== undefined ? () => goTo(viewAfter(index)) : undefined}
        />
      );
  }

  return (
    <div className="quiz">
      <div className="create-progress quiz__progress">
        <div
          className="create-progress__track"
          role="progressbar"
          aria-valuenow={answeredCount}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label="Questions answered"
        >
          <div
            className="create-progress__fill"
            style={{ width: `${total > 0 ? (answeredCount / total) * 100 : 0}%` }}
          />
        </div>
        <p className="create-progress__label">
          {answeredCount} of {total} answered
        </p>
      </div>

      {view.kind === "question" &&
        failedIndexes
          .filter((index) => index !== view.index)
          .map((index) => (
            <p key={questions[index]!.id} role="alert" className="quiz-alert">
              <span>We couldn&apos;t save your answer to question {index + 1}.</span>
              <button
                type="button"
                className="conv-link-button"
                onClick={() => goTo({ kind: "question", index })}
              >
                Go back to it
              </button>
            </p>
          ))}

      {currentStep}

      {view.kind === "complete" && (
        <section className="conv-complete quiz-complete" aria-labelledby="quiz-complete-heading">
          <span className="quiz-complete__badge" aria-hidden="true">
            ✓
          </span>
          <h2
            id="quiz-complete-heading"
            ref={headingRef}
            tabIndex={-1}
            className="conv-complete__heading"
          >
            {completionHeading}
          </h2>
          <p className="conv-complete__text">{completionText}</p>

          <div aria-live="polite">
            {isSaving && <p className="quiz-complete__status">Saving your last answers…</p>}
            {!isSaving &&
              failedIndexes.map((index) => (
                <p key={questions[index]!.id} role="alert" className="quiz-alert">
                  <span>We couldn&apos;t save your answer to question {index + 1}.</span>
                  <button
                    type="button"
                    className="conv-link-button"
                    onClick={() => goTo({ kind: "question", index })}
                  >
                    Go back to it
                  </button>
                </p>
              ))}
            {!isSaving && failedIndexes.length === 0 && firstUnanswered !== -1 && (
              <p className="quiz-complete__status">
                {total - answeredCount === 1
                  ? "One question still needs an answer. "
                  : `${total - answeredCount} questions still need an answer. `}
                <button
                  type="button"
                  className="conv-link-button"
                  onClick={() => goTo({ kind: "question", index: firstUnanswered })}
                >
                  Answer question {firstUnanswered + 1}
                </button>
              </p>
            )}
          </div>

          <p className="conv-complete__review">
            Want to look back first?{" "}
            <button
              type="button"
              className="conv-link-button"
              onClick={() => goTo({ kind: "question", index: 0 })}
            >
              Review your answers
            </button>
          </p>
          {readyToFinish && <div className="conv-complete__action">{completion}</div>}
        </section>
      )}
    </div>
  );
}

interface StepProps {
  index: number;
  total: number;
  question: QuizStepperQuestion;
  tint: CategoryTint;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  hint: string;
  customizeHref?: string;
  saving: boolean;
  error: string | null;
  onPrevious?: () => void;
}

function StepCard({
  index,
  total,
  question,
  tint,
  headingRef,
  hint,
  customizeHref,
  saving,
  error,
  status,
  actions,
  children,
}: StepProps & {
  status: string;
  actions: React.ReactNode;
  children: React.ReactNode;
}) {
  const headingId = `quiz-question-${question.id}`;
  return (
    <section className={`quiz-card quiz-card--${tint}`} aria-labelledby={headingId}>
      <header className="quiz-card__head">
        <span>
          Question {index + 1} of {total}
        </span>
        <span className="quiz-card__status" aria-live="polite">
          {saving ? "Saving…" : status}
        </span>
      </header>
      <div className="quiz-card__body">
        <h2 id={headingId} ref={headingRef} tabIndex={-1} className="quiz-card__question">
          {question.text}
        </h2>
        {children}
        {error && (
          <p role="alert" className="create-form-error">
            {error}
          </p>
        )}
        <div className="conv-actions">{actions}</div>
        <div className="quiz-card__footer">
          <p className="quiz-card__hint">{hint}</p>
          {customizeHref && (
            <Link href={customizeHref} className="quiz-card__customize">
              Customize questions
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function ChoiceStep({
  value,
  onChoose,
  onNext,
  ...step
}: StepProps & {
  value: number | undefined;
  onChoose: (value: number) => void;
  onNext?: () => void;
}) {
  const { question, index, total, onPrevious, saving, error } = step;
  const choices =
    question.type === "scale"
      ? SCALE_VALUES.map((scaleValue) => ({ value: scaleValue, label: SCALE_LABELS[scaleValue] }))
      : (question.options ?? [])
          .map((label, optionIndex) => ({ value: optionIndex, label }))
          .filter((choice) => choice.label.trim().length > 0);

  return (
    <StepCard
      {...step}
      status={value !== undefined && !saving && !error ? "Saved" : ""}
      actions={
        <>
          <button
            type="button"
            className="conv-button conv-button--secondary"
            onClick={onPrevious}
            disabled={!onPrevious}
          >
            <span aria-hidden="true">←</span> Previous
          </button>
          <button
            type="button"
            className="conv-button conv-button--primary"
            onClick={onNext}
            disabled={!onNext}
          >
            {index === total - 1 ? "Finish" : "Next"} <span aria-hidden="true">→</span>
          </button>
        </>
      }
    >
      <div className="quiz-options" role="group" aria-labelledby={`quiz-question-${question.id}`}>
        {choices.map((choice) => {
          const isSelected = choice.value === value;
          return (
            <button
              key={choice.value}
              type="button"
              className={`quiz-option${isSelected ? " quiz-option--selected" : ""}`}
              aria-pressed={isSelected}
              onClick={() => onChoose(choice.value)}
            >
              <span className="quiz-option__mark" aria-hidden="true" />
              <span className="quiz-option__label">{choice.label}</span>
            </button>
          );
        })}
      </div>
    </StepCard>
  );
}

interface OptionSlot {
  key: number;
  value: string;
}

let slotKeyCounter = 0;
function newSlot(value: string): OptionSlot {
  slotKeyCounter += 1;
  return { key: slotKeyCounter, value };
}

function WrittenOptionsStep({
  initialOptions,
  initialCorrect,
  onSubmit,
  onEdit,
  ...step
}: StepProps & {
  initialOptions: string[];
  initialCorrect: number | null;
  onSubmit: (slots: string[], correctSlot: number | null) => void;
  /** Any change to the fields — clears a now-stale validation message. */
  onEdit: () => void;
}) {
  const { question, index, total, onPrevious, saving } = step;
  const [slots, setSlots] = useState<OptionSlot[]>(() => {
    const filled = initialOptions.map((value) => newSlot(value));
    while (filled.length < MIN_CHOICE_OPTIONS) filled.push(newSlot(""));
    return filled;
  });
  const [correctKey, setCorrectKey] = useState<number | null>(() =>
    initialCorrect !== null ? (slots[initialCorrect]?.key ?? null) : null,
  );
  const groupName = `quiz-correct-${question.id}`;

  function submit() {
    const correctSlot = slots.findIndex((slot) => slot.key === correctKey);
    onSubmit(
      slots.map((slot) => slot.value),
      correctSlot === -1 ? null : correctSlot,
    );
  }

  return (
    <StepCard
      {...step}
      status=""
      actions={
        <>
          <button
            type="button"
            className="conv-button conv-button--secondary"
            onClick={onPrevious}
            disabled={!onPrevious || saving}
          >
            <span aria-hidden="true">←</span> Previous
          </button>
          <button
            type="button"
            className="conv-button conv-button--primary"
            onClick={submit}
            disabled={saving}
          >
            {index === total - 1 ? "Finish" : "Next"} <span aria-hidden="true">→</span>
          </button>
        </>
      }
    >
      <fieldset className="quiz-write" disabled={saving}>
        <legend className="quiz-write__legend">
          Write {MIN_CHOICE_OPTIONS}–{MAX_CHOICE_OPTIONS} possible answers, then mark the real one
        </legend>
        {slots.map((slot, slotIndex) => (
          <div className="quiz-write__row" key={slot.key}>
            <input
              type="radio"
              name={groupName}
              className="quiz-write__correct"
              checked={correctKey === slot.key}
              onChange={() => {
                setCorrectKey(slot.key);
                onEdit();
              }}
              aria-label={`Answer ${slotIndex + 1} is the real one`}
            />
            <input
              type="text"
              className="create-input"
              value={slot.value}
              maxLength={200}
              placeholder={`Answer ${slotIndex + 1}`}
              aria-label={`Answer ${slotIndex + 1}`}
              onChange={(event) => {
                const value = event.currentTarget.value;
                onEdit();
                setSlots((current) =>
                  current.map((entry) => (entry.key === slot.key ? { ...entry, value } : entry)),
                );
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submit();
                }
              }}
            />
            <button
              type="button"
              className="create-option-remove"
              onClick={() => {
                setSlots((current) => current.filter((entry) => entry.key !== slot.key));
                if (correctKey === slot.key) setCorrectKey(null);
                onEdit();
              }}
              disabled={slots.length <= MIN_CHOICE_OPTIONS}
              aria-label={`Remove answer ${slotIndex + 1}`}
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          className="create-add-option"
          onClick={() => {
            setSlots((current) => [...current, newSlot("")]);
            onEdit();
          }}
          disabled={slots.length >= MAX_CHOICE_OPTIONS}
        >
          + Add another answer
        </button>
      </fieldset>
    </StepCard>
  );
}
