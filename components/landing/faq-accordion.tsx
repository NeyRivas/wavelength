"use client";

import { useState } from "react";

import type { FaqItem, FaqTint } from "./faq-data";

interface FaqAccordionProps {
  items: FaqItem[];
  tint: FaqTint;
}

/**
 * The question list for whichever category is currently selected
 * (components/landing/faq-section.tsx owns that selection). Each
 * question has its own, independent open/closed state — a second,
 * separate interaction level from the category tabs above it: switching
 * categories never opens or closes anything here, it just swaps which
 * `items` this component receives (and this component resets its own
 * open state whenever that happens, via `key={category.id}` on the
 * parent). Every category always starts fully collapsed — on first load
 * and on every category switch alike — so nothing is ever auto-expanded;
 * the user has to click a "+" to see any answer.
 *
 * The "+" toggle rotates 45° into an "×" on open rather than swapping to
 * a literal "−" glyph — same visual result as the reference, one glyph,
 * no icon library.
 */
export function FaqAccordion({ items, tint }: FaqAccordionProps) {
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
      {items.map((item) => {
        const isOpen = openQuestions.has(item.question);
        return (
          <div className="faq-item" key={item.question}>
            <button
              type="button"
              className="faq-item__row"
              aria-expanded={isOpen}
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

            {isOpen ? (
              <p className={`faq-item__answer faq-item__answer--${tint}`}>{item.answer}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
