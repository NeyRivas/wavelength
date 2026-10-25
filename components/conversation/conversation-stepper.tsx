"use client";

import { useEffect, useRef, useState } from "react";

import { saveAnswerA, saveAnswerB } from "@/app/actions/answers";
import { initialActionState } from "@/app/actions/shared";
import { MAX_OPEN_ANSWER_LENGTH } from "@/lib/validation/schemas";
import {
  stagePositionForIndex,
  type ConversationExperience,
} from "@/lib/wavelength/conversation-experiences";

const SAVE_ACTIONS = { A: saveAnswerA, B: saveAnswerB } as const;

type View =
  | { kind: "stage"; stageIndex: number }
  | { kind: "question"; index: number }
  | { kind: "complete" };

const EMPTY_ANSWER_ERROR =
  "Write a few words before moving on — you can come back and change it any time before you finish.";

/**
 * One question at a time, for a fixed conversation experience
 * (lib/wavelength/conversation-experiences.ts). Used by both participants:
 * A on /create (before sharing), B on /w/[token]/answer — `participant`
 * only picks which existing Server Action saves the answer (saveAnswerA /
 * saveAnswerB, app/actions/answers.ts, where the participant slot is
 * hardcoded server-side, never taken from this form). Nothing here can
 * add, remove, edit, or reorder a question: it only renders the fixed,
 * already-seeded set it's given.
 *
 * Progress is never only in the browser: an answer is saved to the
 * database whenever the participant moves on (Next, Previous, or a stage
 * jump), so leaving and coming back resumes at the first unanswered
 * question. The only unsaved state is the text currently being typed —
 * the browser's "leave this page?" prompt guards that.
 *
 * `completion` is the existing terminal step for this participant
 * (FinalizeForm for A, SubmitFinalForm for B), shown once all questions
 * are answered.
 */
export function ConversationStepper({
  experience,
  participant,
  wavelengthId,
  questions,
  initialAnswers,
  completionText,
  completion,
}: {
  experience: ConversationExperience;
  participant: "A" | "B";
  wavelengthId: string;
  /** Already in play order. */
  questions: { id: string; text: string }[];
  initialAnswers: Record<string, string>;
  completionText: string;
  completion: React.ReactNode;
}) {
  const total = questions.length;
  const [saved, setSaved] = useState<Record<string, string>>(initialAnswers);
  const [drafts, setDrafts] = useState<Record<string, string>>(initialAnswers);
  const [view, setView] = useState<View>(() => initialView(experience, questions, initialAnswers));
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<"saved" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isFirstRender = useRef(true);

  const isAnswered = (questionId: string) => (saved[questionId] ?? "").trim().length > 0;
  const answeredCount = questions.filter((question) => isAnswered(question.id)).length;
  const firstUnanswered = questions.findIndex((question) => !isAnswered(question.id));
  /** Furthest question the participant may jump to: everything up to and
   * including the first unanswered one. */
  const reachable = firstUnanswered === -1 ? total - 1 : firstUnanswered;
  const hasUnsavedText = questions.some(
    (question) =>
      (drafts[question.id] ?? "").trim().length > 0 &&
      (drafts[question.id] ?? "") !== (saved[question.id] ?? ""),
  );

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
    if (!hasUnsavedText && !pending) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsavedText, pending]);

  /** Saves the given question's typed answer if it changed. Returns false
   * (and shows why) if it couldn't be saved. */
  async function persist(questionId: string): Promise<boolean> {
    const draft = drafts[questionId] ?? "";
    if (draft === (saved[questionId] ?? "")) return true;
    if (draft.trim().length === 0) {
      // Can't store an empty answer; keep the last saved one instead.
      setDrafts((current) => ({ ...current, [questionId]: saved[questionId] ?? "" }));
      return true;
    }

    setPending(true);
    setStatus(null);
    const formData = new FormData();
    formData.set("wavelengthId", wavelengthId);
    formData.set("questionId", questionId);
    formData.set("value", draft);
    try {
      const result = await SAVE_ACTIONS[participant](initialActionState, formData);
      if (result.error) {
        setError(result.error);
        return false;
      }
      setSaved((current) => ({ ...current, [questionId]: draft }));
      setStatus("saved");
      return true;
    } catch {
      setError("We couldn't save that answer. Check your connection and try again.");
      return false;
    } finally {
      setPending(false);
    }
  }

  function goTo(next: View) {
    setError(null);
    setView(next);
  }

  async function next(index: number) {
    const question = questions[index]!;
    if ((drafts[question.id] ?? "").trim().length === 0) {
      setError(EMPTY_ANSWER_ERROR);
      return;
    }
    if (!(await persist(question.id))) return;
    const nextIndex = index + 1;
    if (nextIndex >= total) {
      goTo({ kind: "complete" });
    } else if (stagePositionForIndex(experience, nextIndex).indexInStage === 0) {
      goTo({ kind: "stage", stageIndex: stagePositionForIndex(experience, nextIndex).stageIndex });
    } else {
      goTo({ kind: "question", index: nextIndex });
    }
  }

  async function previous(index: number) {
    if (!(await persist(questions[index]!.id))) return;
    goTo({ kind: "question", index: index - 1 });
  }

  async function jumpToStage(stageIndex: number) {
    if (view.kind === "question" && !(await persist(questions[view.index]!.id))) return;
    goTo({ kind: "question", index: stageStartIndex(experience, stageIndex) });
  }

  const currentStageIndex =
    view.kind === "stage"
      ? view.stageIndex
      : view.kind === "question"
        ? stagePositionForIndex(experience, view.index).stageIndex
        : null;

  return (
    <div className="conv">
      <div className="create-progress conv__progress">
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

      <nav className="conv-stages" aria-label="Stages">
        <ol className="conv-stages__list">
          {experience.stages.map((stage, stageIndex) => {
            const start = stageStartIndex(experience, stageIndex);
            const stageAnswered = questions
              .slice(start, start + stage.questions.length)
              .filter((question) => isAnswered(question.id)).length;
            const isCurrent = currentStageIndex === stageIndex;
            return (
              <li key={stage.number}>
                <button
                  type="button"
                  className={`conv-stages__item conv-stages__item--${stage.number}${isCurrent ? " conv-stages__item--current" : ""}`}
                  aria-current={isCurrent ? "step" : undefined}
                  disabled={pending || start > reachable}
                  onClick={() => jumpToStage(stageIndex)}
                >
                  <span className="conv-stages__number">Stage {stage.number}</span>
                  <span className="conv-stages__title">{stage.title}</span>
                  <span className="conv-stages__count">
                    {stageAnswered}/{stage.questions.length}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {view.kind === "stage" && (
        <StageIntro
          experience={experience}
          stageIndex={view.stageIndex}
          headingRef={headingRef}
          onBegin={() =>
            goTo({ kind: "question", index: stageStartIndex(experience, view.stageIndex) })
          }
          onBack={
            view.stageIndex > 0
              ? () =>
                  goTo({
                    kind: "question",
                    index: stageStartIndex(experience, view.stageIndex) - 1,
                  })
              : undefined
          }
        />
      )}

      {view.kind === "question" && (
        <QuestionStep
          key={questions[view.index]!.id}
          experience={experience}
          index={view.index}
          total={total}
          question={questions[view.index]!}
          value={drafts[questions[view.index]!.id] ?? ""}
          onChange={(value) => {
            const questionId = questions[view.index]!.id;
            setStatus(null);
            if (error === EMPTY_ANSWER_ERROR) setError(null);
            setDrafts((current) => ({ ...current, [questionId]: value }));
          }}
          headingRef={headingRef}
          pending={pending}
          status={status}
          error={error}
          onPrevious={view.index > 0 ? () => previous(view.index) : undefined}
          onNext={() => next(view.index)}
        />
      )}

      {view.kind === "complete" && (
        <section className="conv-complete" aria-labelledby="conv-complete-heading">
          <svg className="conv-complete__motif" viewBox="0 0 200 60" fill="none" aria-hidden="true">
            <path
              d="M14 32c26-20 52-20 72 0s46 20 72 0"
              stroke="var(--wl-muted)"
              strokeWidth="1.5"
              strokeDasharray="5 6"
            />
            <circle
              cx="14"
              cy="32"
              r="7"
              fill="#ffffff"
              stroke="var(--wl-pink)"
              strokeWidth="3.5"
            />
            <circle cx="100" cy="32" r="9" fill="var(--wl-peach)" />
            <circle
              cx="186"
              cy="32"
              r="7"
              fill="#ffffff"
              stroke="var(--wl-lavender)"
              strokeWidth="3.5"
            />
          </svg>
          <h2
            id="conv-complete-heading"
            ref={headingRef}
            tabIndex={-1}
            className="conv-complete__heading"
          >
            You&apos;ve finished all three stages
          </h2>
          <p className="conv-complete__text">{completionText}</p>
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
          {answeredCount === total && <div className="conv-complete__action">{completion}</div>}
        </section>
      )}
    </div>
  );
}

function StageIntro({
  experience,
  stageIndex,
  headingRef,
  onBegin,
  onBack,
}: {
  experience: ConversationExperience;
  stageIndex: number;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onBegin: () => void;
  onBack?: () => void;
}) {
  const stage = experience.stages[stageIndex]!;
  return (
    <section
      className={`conv-stage-intro conv-stage-intro--${stage.number}`}
      aria-labelledby="conv-stage-heading"
    >
      {stageIndex > 0 && (
        <p className="conv-stage-intro__done">
          Stage {experience.stages[stageIndex - 1]!.number} complete
        </p>
      )}
      <p className="conv-stage-intro__eyebrow">
        Stage {stage.number} of {experience.stages.length}
      </p>
      <h2
        id="conv-stage-heading"
        ref={headingRef}
        tabIndex={-1}
        className="conv-stage-intro__title"
      >
        {stage.title}
      </h2>
      <p className="conv-stage-intro__text">{stage.description}</p>
      <p className="conv-stage-intro__count">{stage.questions.length} questions</p>
      <div className="conv-actions">
        {onBack && (
          <button type="button" className="conv-button conv-button--secondary" onClick={onBack}>
            <span aria-hidden="true">←</span> Previous
          </button>
        )}
        <button type="button" className="conv-button conv-button--primary" onClick={onBegin}>
          {stageIndex === 0 ? "Let's begin" : `Begin stage ${stage.number}`}{" "}
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}

function QuestionStep({
  experience,
  index,
  total,
  question,
  value,
  onChange,
  headingRef,
  pending,
  status,
  error,
  onPrevious,
  onNext,
}: {
  experience: ConversationExperience;
  index: number;
  total: number;
  question: { id: string; text: string };
  value: string;
  onChange: (value: string) => void;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  pending: boolean;
  status: "saved" | null;
  error: string | null;
  onPrevious?: () => void;
  onNext: () => void;
}) {
  const { stage, indexInStage } = stagePositionForIndex(experience, index);
  const headingId = `conv-question-${question.id}`;
  const hintId = `conv-hint-${question.id}`;
  const isLastInStage = indexInStage === stage.questions.length - 1;
  const nextLabel =
    index === total - 1 ? "Finish" : isLastInStage ? `Finish stage ${stage.number}` : "Next";

  return (
    <section className={`conv-card conv-card--${stage.number}`} aria-labelledby={headingId}>
      <header className="conv-card__head">
        <span className="conv-card__stage">
          Stage {stage.number} · {stage.title}
        </span>
        <span className="conv-card__number">
          Question {index + 1} of {total}
        </span>
      </header>

      <div className="conv-card__body">
        <p className="conv-card__position">
          {indexInStage + 1} of {stage.questions.length} in this stage
        </p>
        <h2 id={headingId} ref={headingRef} tabIndex={-1} className="conv-card__question">
          {question.text}
        </h2>

        <textarea
          className="create-input conv-card__answer"
          aria-labelledby={headingId}
          aria-describedby={hintId}
          value={value}
          maxLength={MAX_OPEN_ANSWER_LENGTH}
          rows={5}
          placeholder="Write your answer…"
          disabled={pending}
          onChange={(event) => onChange(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              onNext();
            }
          }}
        />
        <p id={hintId} className="conv-card__hint">
          Only you can see your answers until you&apos;ve both finished.{" "}
          <span className="conv-card__counter">
            {value.length}/{MAX_OPEN_ANSWER_LENGTH}
          </span>
        </p>

        <p className="create-save-status" aria-live="polite">
          {pending ? "Saving…" : status === "saved" ? "Saved" : ""}
        </p>
        {error && (
          <p role="alert" className="create-form-error">
            {error}
          </p>
        )}

        <div className="conv-actions">
          <button
            type="button"
            className="conv-button conv-button--secondary"
            onClick={onPrevious}
            disabled={!onPrevious || pending}
          >
            <span aria-hidden="true">←</span> Previous
          </button>
          <button
            type="button"
            className="conv-button conv-button--primary"
            onClick={onNext}
            disabled={pending}
          >
            {nextLabel} <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}

function stageStartIndex(experience: ConversationExperience, stageIndex: number): number {
  return experience.stages
    .slice(0, stageIndex)
    .reduce((total, stage) => total + stage.questions.length, 0);
}

/** Resume where the participant left off: the first unanswered question
 * (or its stage's intro, if it opens a stage), or the completion step. */
function initialView(
  experience: ConversationExperience,
  questions: { id: string }[],
  answers: Record<string, string>,
): View {
  const first = questions.findIndex((question) => !(answers[question.id] ?? "").trim());
  if (first === -1) return { kind: "complete" };
  const position = stagePositionForIndex(experience, first);
  return position.indexInStage === 0
    ? { kind: "stage", stageIndex: position.stageIndex }
    : { kind: "question", index: first };
}
