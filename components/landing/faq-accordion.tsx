"use client";

import { useState } from "react";

import type { FaqItem, FaqTint } from "./faq-data";

interface FaqAccordionProps {
  categoryId: string;
  items: FaqItem[];
  tint: FaqTint;
}

/**
 * The question list for one category (components/landing/faq-section.tsx
 * owns category selection and renders one FaqAccordion per category —
 * see its own doc comment). Each question has its own, independent
 * open/closed state — a second, separate interaction level from the
 * category tabs above it. Every category starts fully collapsed on
 * first load, so nothing is ever auto-expanded; the user has to click a
 * "+" to see any answer.
 *
 * The "+" toggle rotates 45° into an "×" on open rather than swapping to
 * a literal "−" glyph — same visual result as the reference, one glyph,
 * no icon library.
 *
 * SEO pass: each answer is always in the DOM (so it's present in the
 * initial server-rendered HTML, same as the question text already was),
 * collapsed visually via the `hidden` attribute instead of being
 * mounted/unmounted. `.faq-item__answer` sets no `display` of its own, so
 * the browser's default `[hidden] { display: none }` applies cleanly —
 * same visual result as before (nothing shown, no layout space taken)
 * when closed, nothing changed when open. `aria-controls` on the toggle
 * button now points at the answer's `id`, matching the existing
 * `aria-expanded`. `categoryId` namespaces that id (faq-answer-<category>-
 * <index>) because faq-section.tsx now mounts every category's accordion
 * at once (see its own doc comment) — plain per-item indices alone would
 * collide across categories.
 */
export function FaqAccordion({ categoryId, items, tint }: FaqAccordionProps) {
  const [openQuestions, setOpenQuestions] = useState<ReadonlySet<string>>(() => new Set());

  function toggle(question: string) {
    setOpenQuestions((current) => {
      const next = new Set(current);
      if (next.has(question)) {
        next.delete(question);
      } else {
        next.add(question);
      }
      return next;
    });
  }

  return (
    <div className="faq-accordion">
      {items.map((item, index) => {
        const isOpen = openQuestions.has(item.question);
        const answerId = `faq-answer-${categoryId}-${index}`;
        return (
          <div className="faq-item" key={item.question}>
            <button
              type="button"
              className="faq-item__row"
              aria-expanded={isOpen}
              aria-controls={answerId}
              onClick={() => toggle(item.question)}
            >
              <span className="faq-item__question">{item.question}</span>
              <span
                className={`faq-item__toggle${isOpen ? ` faq-item__toggle--open faq-item__toggle--${tint}` : ""}`}
                aria-hidden="true"
              >
                +
              </span>
            </button>

            <p
              id={answerId}
              className={`faq-item__answer faq-item__answer--${tint}`}
              hidden={!isOpen}
            >
              {item.answer}
            </p>
          </div>
        );
      })}
    </div>
  );
}
