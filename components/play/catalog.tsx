import Link from "next/link";

import {
  OverprintGlyph,
  type OverprintArrangement,
  type OverprintTone,
} from "@/components/overprint/overprint-glyph";

import {
  catalogHref,
  MAKE_YOUR_OWN,
  type CatalogCard,
  type CatalogSection,
} from "@/lib/wavelength/catalog";

/**
 * The unified game catalog's building blocks: a section of ready-made game
 * cards (used by /play for every group, and by /play/dating-couples and
 * /play/friends for their own group) and the Make Your Own section (/play).
 *
 * Every ready-made card has the same four-part hierarchy, in this order:
 * main title (the game's name), category subtitle, a short description,
 * and one "Play →" CTA. The whole card is a single link to the game's
 * experience page, so there's exactly one action per card. Styling is the
 * page-scoped .catalog-* block in app/globals.css.
 */

type Tone = "mint" | "blue" | "lavender" | "peach" | "pink";

/** Each game's card tone — the same tone as its experience page where
 * that page has one, from the approved pastel palette. */
const TONE_BY_GAME_ID: Record<string, Tone> = {
  "how-well-do-you-know-each-other": "mint",
  "getting-to-know-you": "blue",
  "36-questions-to-fall-in-love": "lavender",
  "date-night": "peach",
  "how-well-do-you-know-me": "lavender",
  "friendship-check": "pink",
};

// Each game's cover: which two tones overprint, and how the discs sit
// (see components/overprint/overprint-glyph.tsx for what each means).
const GLYPH_BY_GAME_ID: Record<
  string,
  { arrangement: OverprintArrangement; tones: [OverprintTone, OverprintTone] }
> = {
  "how-well-do-you-know-each-other": { arrangement: "overlap", tones: ["mint", "blue"] },
  "getting-to-know-you": { arrangement: "touch", tones: ["blue", "lavender"] },
  "36-questions-to-fall-in-love": { arrangement: "nested", tones: ["lavender", "pink"] },
  "date-night": { arrangement: "horizon", tones: ["peach", "pink"] },
  "how-well-do-you-know-me": { arrangement: "guess", tones: ["lavender", "lavender"] },
  "friendship-check": { arrangement: "echo", tones: ["pink", "mint"] },
};

export function CatalogCardLink({ card }: { card: CatalogCard }) {
  const tone = TONE_BY_GAME_ID[card.gameId] ?? "lavender";
  return (
    <Link href={catalogHref(card)} className={`catalog-card catalog-card--${tone}`}>
      <OverprintGlyph
        className="catalog-card__glyph"
        arrangement={GLYPH_BY_GAME_ID[card.gameId]?.arrangement ?? "overlap"}
        tones={GLYPH_BY_GAME_ID[card.gameId]?.tones ?? [tone, "blue"]}
      />
      <h3 className="catalog-card__title">{card.title}</h3>
      <p className="catalog-card__subtitle">{card.subtitle}</p>
      <p className="catalog-card__description">{card.description}</p>
      <span className="catalog-card__cta">
        Play <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}

export function CatalogSectionBlock({
  section,
  headingLevel = "h2",
}: {
  section: CatalogSection;
  /** h1 on a group's own page (/play/dating-couples, /play/friends),
   * h2 under /play's own h1. */
  headingLevel?: "h1" | "h2";
}) {
  const Heading = headingLevel;
  const headingId = `catalog-${section.group}`;
  return (
    <section className="catalog-section" aria-labelledby={headingId}>
      <div className="catalog-section__header">
        <Heading id={headingId} className="catalog-section__heading">
          {section.heading}
        </Heading>
        <p className="catalog-section__intro">{section.intro}</p>
      </div>
      <ul className="catalog-grid">
        {section.cards.map((card) => (
          <li key={card.gameId} className="catalog-grid__item">
            <CatalogCardLink card={card} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MakeYourOwnSection() {
  return (
    <section className="catalog-section" aria-labelledby="catalog-make-your-own">
      <div className="catalog-section__header">
        <h2 id="catalog-make-your-own" className="catalog-section__heading">
          {MAKE_YOUR_OWN.heading}
        </h2>
        <p className="catalog-section__intro">{MAKE_YOUR_OWN.intro}</p>
      </div>
      <Link href={MAKE_YOUR_OWN.href} className="catalog-create">
        <span className="catalog-create__shapes" aria-hidden="true">
          <span className="catalog-create__shape catalog-create__shape--lavender" />
          <span className="catalog-create__shape catalog-create__shape--mint" />
          <span className="catalog-create__shape catalog-create__shape--pink" />
        </span>
        <div className="catalog-create__body">
          <h3 className="catalog-card__title catalog-create__title">{MAKE_YOUR_OWN.title}</h3>
          <p className="catalog-card__subtitle catalog-create__subtitle">
            {MAKE_YOUR_OWN.subtitle}
          </p>
          <p className="catalog-card__description catalog-create__description">
            {MAKE_YOUR_OWN.description}
          </p>
        </div>
        <span className="catalog-create__cta">
          {MAKE_YOUR_OWN.cta} <span aria-hidden="true">→</span>
        </span>
      </Link>
    </section>
  );
}
