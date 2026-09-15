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
 * touches routing (no navigation, no reload, no four separate pages) and
 * never affects any question's own open/closed state beyond resetting it
 * for the newly-shown list.
 */
export function FaqSection() {
  const [activeId, setActiveId] = useState(DEFAULT_CATEGORY.id);
  const activeCategory =
    FAQ_CATEGORIES.find((category) => category.id === activeId) ?? DEFAULT_CATEGORY;

  return (
    <section className="landing-section faq-section">
      <FaqCategories categories={FAQ_CATEGORIES} activeId={activeId} onSelect={setActiveId} />

      <div className="faq-section__group">
        <p className="faq-section__group-label">
          <span
            className={`faq-section__group-dot faq-section__group-dot--${activeCategory.tint}`}
            aria-hidden="true"
          />
          {activeCategory.label}
        </p>

        <FaqAccordion
          key={activeCategory.id}
          items={activeCategory.questions}
          tint={activeCategory.tint}
        />
      </div>
    </section>
  );
}
