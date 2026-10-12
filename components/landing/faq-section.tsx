"use client";

import { useState } from "react";

import { FaqAccordion } from "./faq-accordion";
import { FaqCategories } from "./faq-categories";
import { FAQ_CATEGORIES } from "./faq-data";

const DEFAULT_CATEGORY = FAQ_CATEGORIES[0]!;

/**
 * The interactive core of /faq: category tabs (components/landing/
 * faq-categories.tsx) control which category is selected, and the
 * accordion (components/landing/faq-accordion.tsx) renders only that
 * category's questions — two separate interaction levels sharing one
 * piece of state (`activeId`), owned here so switching categories never
 * touches routing (no navigation, no reload, no four separate pages).
 *
 * SEO pass: every category's group (label + accordion) is always in the
 * DOM, not just the active one, so all of /faq's questions and answers
 * — across all four categories — are present in the initial
 * server-rendered HTML. Only the active category's group is shown; the
 * rest are hidden via the `hidden` attribute, the same technique
 * FaqAccordion itself already uses for individual collapsed answers (see
 * that file). One side effect of no longer unmounting/remounting a
 * category's accordion on every switch: a category's own open/closed
 * answers now persist while you're on a different tab, instead of always
 * resetting to collapsed — expand/collapse itself still works exactly as
 * before within a category.
 */
export function FaqSection() {
  const [activeId, setActiveId] = useState(DEFAULT_CATEGORY.id);

  return (
    <section className="landing-section faq-section">
      <FaqCategories categories={FAQ_CATEGORIES} activeId={activeId} onSelect={setActiveId} />

      {FAQ_CATEGORIES.map((category) => (
        <div className="faq-section__group" key={category.id} hidden={category.id !== activeId}>
          <p className="faq-section__group-label">
            <span
              className={`faq-section__group-dot faq-section__group-dot--${category.tint}`}
              aria-hidden="true"
            />
            {category.label}
          </p>

          <FaqAccordion categoryId={category.id} items={category.questions} tint={category.tint} />
        </div>
      ))}
    </section>
  );
}
