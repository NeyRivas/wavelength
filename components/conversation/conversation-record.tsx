"use client";

import { useId, useRef, useState } from "react";

import type { ConversationStage } from "@/lib/wavelength/conversation-experiences";

export interface ConversationRecordAnswer {
  label: string;
  text: string | null;
}

export interface ConversationRecordViewStage {
  stage: ConversationStage;
  entries: {
    id: string;
    number: number;
    text: string;
    answers: ConversationRecordAnswer[];
  }[];
}

/**
 * A read-only conversation record, one stage per tab, every question with
 * the answers it's given underneath. Used for both:
 * - the shared result (app/w/[token]/result) — two answers per question,
 *   only ever rendered once the wavelength is COMPLETED, and
 * - A's own review on the share screen (app/w/[token]) — A's answers only.
 * It renders exactly the answers it receives; it never fetches anything.
 *
 * Tabs follow the WAI-ARIA tabs pattern (arrow keys / Home / End move
 * between stages). Every panel stays in the DOM (`hidden` when inactive)
 * so the whole record is also readable in one pass by assistive tech that
 * ignores tabs.
 */
export function ConversationRecord({
  stages,
  initialStage = 0,
}: {
  stages: ConversationRecordViewStage[];
  initialStage?: number;
}) {
  const [active, setActive] = useState(initialStage);
  const baseId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function select(index: number, focus = false) {
    setActive(index);
    if (focus) tabRefs.current[index]?.focus();
  }

  function onTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = stages.length - 1;
    const target =
      event.key === "ArrowRight"
        ? index === last
          ? 0
          : index + 1
        : event.key === "ArrowLeft"
          ? index === 0
            ? last
            : index - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (target === null) return;
    event.preventDefault();
    select(target, true);
  }

  return (
    <div className="conv-record">
      <div className="conv-record__tabs" role="tablist" aria-label="Stages">
        {stages.map(({ stage }, index) => (
          <button
            key={stage.number}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            type="button"
            role="tab"
            id={`${baseId}-tab-${index}`}
            aria-selected={active === index}
            aria-controls={`${baseId}-panel-${index}`}
            tabIndex={active === index ? 0 : -1}
            className={`conv-stages__item conv-stages__item--${stage.number}${active === index ? " conv-stages__item--current" : ""}`}
            onClick={() => select(index)}
            onKeyDown={(event) => onTabKeyDown(event, index)}
          >
            <span className="conv-stages__number">Stage {stage.number}</span>
            <span className="conv-stages__title">{stage.title}</span>
          </button>
        ))}
      </div>

      {stages.map(({ stage, entries }, index) => (
        <section
          key={stage.number}
          role="tabpanel"
          id={`${baseId}-panel-${index}`}
          aria-labelledby={`${baseId}-tab-${index}`}
          hidden={active !== index}
          className="conv-record__panel"
        >
          <p className="conv-record__stage-text">{stage.description}</p>
          <ol className="conv-record__list">
            {entries.map((entry) => (
              <li key={entry.id}>
                <article
                  className={`conv-entry conv-entry--${stage.number}`}
                  aria-labelledby={`${baseId}-q-${entry.id}`}
                >
                  <p className="conv-entry__number">Question {entry.number}</p>
                  <h3 id={`${baseId}-q-${entry.id}`} className="conv-entry__question">
                    {entry.text}
                  </h3>
                  <dl className="conv-entry__answers">
                    {entry.answers.map((answer, answerIndex) => (
                      <div
                        key={answerIndex}
                        className={`conv-entry__answer conv-entry__answer--${answerIndex === 0 ? "a" : "b"}`}
                      >
                        <dt className="conv-entry__alias">{answer.label}</dt>
                        <dd className="conv-entry__text">
                          {answer.text ?? <span className="conv-entry__empty">Not answered</span>}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </article>
              </li>
            ))}
          </ol>

          <div className="conv-actions conv-record__nav">
            {index > 0 ? (
              <button
                type="button"
                className="conv-button conv-button--secondary"
                onClick={() => select(index - 1, true)}
              >
                <span aria-hidden="true">←</span> Stage {stages[index - 1]!.stage.number}
              </button>
            ) : (
              <span />
            )}
            {index < stages.length - 1 && (
              <button
                type="button"
                className="conv-button conv-button--primary"
                onClick={() => select(index + 1, true)}
              >
                Stage {stages[index + 1]!.stage.number} <span aria-hidden="true">→</span>
              </button>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
