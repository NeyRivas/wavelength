import Link from "next/link";
import type { ReactNode } from "react";

import { startReadyMadeGame } from "@/app/actions/ready-made-games";
import { FaqAccordion } from "@/components/landing/faq-accordion";
import type { FaqItem, FaqTint } from "@/components/landing/faq-data";
import { CATEGORY_LABELS, type Category } from "@/lib/wavelength/categories";

/**
 * Shared building blocks for the integrated experience pages under /play
 * (Getting to know each other, How Well Do You Know Me?, Friendship Check,
 * the Couples Compatibility Test, and Date Night's editorial section):
 * one consistent structure — modeled on the approved 36 Questions page —
 * with each page supplying its own copy, questions, and tone. Styling is
 * the page-scoped .xp-* block in app/globals.css, which mirrors .tsq-*'s
 * values without reusing its names, so nothing here can restyle 36
 * Questions.
 *
 * Everything is static: no questionnaire, participant, or answer is read.
 */

export type ExperienceTone = "blue" | "mint" | "lavender" | "peach" | "pink";

export function ExperienceArticle({
  tone,
  embedded = false,
  children,
}: {
  tone: ExperienceTone;
  /** An editorial section below an interactive tool on its own page
   * (Date Night), rather than a whole experience page. */
  embedded?: boolean;
  children: ReactNode;
}) {
  return (
    <article
      className={`landing-section landing-how xp-page xp-page--${tone}${embedded ? " xp-page--embedded" : ""}`}
    >
      {children}
    </article>
  );
}

export function ExperienceHero({
  eyebrow,
  title,
  shapes,
  children,
  action,
  note,
}: {
  eyebrow: string;
  title: string;
  shapes: [ExperienceTone, ExperienceTone];
  children: ReactNode;
  action: ReactNode;
  note?: string;
}) {
  return (
    <header className="xp-hero">
      <div className="xp-hero__shapes" aria-hidden="true">
        <span className={`xp-hero__shape xp-hero__shape--first xp-shape--${shapes[0]}`} />
        <span className={`xp-hero__shape xp-hero__shape--second xp-shape--${shapes[1]}`} />
      </div>
      <div className="xp-hero__content">
        <p className="xp-hero__eyebrow">{eyebrow}</p>
        <h1 className="xp-hero__title">{title}</h1>
        <div className="xp-hero__text">{children}</div>
        <div className="xp-hero__cta">
          {action}
          {note && <p className="xp-hero__note">{note}</p>}
        </div>
      </div>
    </header>
  );
}

export function ExperienceSection({
  id,
  heading,
  children,
}: {
  id: string;
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="xp-section" aria-labelledby={id}>
      <h2 id={id} className="xp-section__heading">
        {heading}
      </h2>
      {children}
    </section>
  );
}

export function ExperienceText({ children }: { children: ReactNode }) {
  return <p className="xp-section__text">{children}</p>;
}

export function ExperienceLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="xp-inline-link">
      {children}
    </Link>
  );
}

export function ExperienceSteps({ steps }: { steps: { title: string; text: string }[] }) {
  return (
    <ol className="xp-steps">
      {steps.map((step, index) => (
        <li key={step.title} className="xp-step">
          <span className="xp-step__number" aria-hidden="true">
            {index + 1}
          </span>
          <div>
            <h3 className="xp-step__title">{step.title}</h3>
            <p className="xp-step__text">{step.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ExperiencePoints({
  points,
  pairs = false,
}: {
  points: { title: string; text: string }[];
  /** Two columns instead of up to three — for an even number of points. */
  pairs?: boolean;
}) {
  return (
    <ul className={`xp-points${pairs ? " xp-points--pairs" : ""}`}>
      {points.map((point) => (
        <li key={point.title} className="xp-point">
          <h3 className="xp-point__title">{point.title}</h3>
          <p className="xp-point__text">{point.text}</p>
        </li>
      ))}
    </ul>
  );
}

/** Pill tint per question category, from the existing --wl-* palette. */
const CATEGORY_TINTS: Record<Category, ExperienceTone> = {
  relationship: "pink",
  lifestyle: "mint",
  adventures_travel: "blue",
  values_priorities: "lavender",
  money: "peach",
  future: "blue",
};

export interface ExperienceQuestion {
  text: string;
  category: Category;
  /** Optional collapsible detail under the question, e.g. its answer
   * choices. Omitted for games whose answers each player writes. */
  detail?: { summary: string; items: string[] };
}

/** Every question of a game, in the game's own order. */
export function ExperienceQuestionList({ questions }: { questions: ExperienceQuestion[] }) {
  return (
    <ol className="xp-questions">
      {questions.map((question, index) => (
        <li key={question.text} className="xp-question">
          <span className="xp-question__number" aria-hidden="true">
            {index + 1}
          </span>
          <div className="xp-question__body">
            <span className={`xp-question__pill xp-pill--${CATEGORY_TINTS[question.category]}`}>
              {CATEGORY_LABELS[question.category]}
            </span>
            <p className="xp-question__text">{question.text}</p>
            {question.detail && question.detail.items.length > 0 && (
              <details className="xp-question__details">
                <summary className="xp-question__summary">{question.detail.summary}</summary>
                <ul className="xp-question__options">
                  {question.detail.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ExperienceCta({
  id,
  heading,
  text,
  children,
}: {
  id: string;
  heading: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <section className="xp-cta" aria-labelledby={id}>
      <h2 id={id} className="xp-cta__heading">
        {heading}
      </h2>
      <p className="xp-cta__text">{text}</p>
      {children}
    </section>
  );
}

export function ExperienceFaq({
  categoryId,
  items,
  tint,
}: {
  categoryId: string;
  items: FaqItem[];
  tint: FaqTint;
}) {
  return (
    <ExperienceSection id={`xp-faq-${categoryId}`} heading="Questions people ask">
      <FaqAccordion categoryId={categoryId} items={items} tint={tint} />
    </ExperienceSection>
  );
}

export interface RelatedExperience {
  href: string;
  eyebrow: string;
  title: string;
  text: string;
  tone: ExperienceTone;
}

export function ExperienceRelated({
  heading,
  items,
}: {
  heading: string;
  items: RelatedExperience[];
}) {
  return (
    <nav className="xp-section xp-related" aria-labelledby="xp-related">
      <h2 id="xp-related" className="xp-section__heading">
        {heading}
      </h2>
      <ul className={`xp-related__list xp-related__list--${items.length}`}>
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className={`xp-related__card xp-related__card--${item.tone}`}>
              <span className="xp-related__eyebrow">{item.eyebrow}</span>
              <span className="xp-related__title">{item.title}</span>
              <span className="xp-related__text">{item.text}</span>
              <span className="xp-related__go">
                Explore <span aria-hidden="true">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Starts (or resumes) the visitor's own draft of a ready-made game — the
 * unchanged startReadyMadeGame action the catalog cards used to submit. */
export function StartGameForm({ gameId, label }: { gameId: string; label: string }) {
  return (
    <form action={startReadyMadeGame}>
      <input type="hidden" name="gameId" value={gameId} />
      <button type="submit" className="landing-button landing-button--primary landing-button--play">
        {label} <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
