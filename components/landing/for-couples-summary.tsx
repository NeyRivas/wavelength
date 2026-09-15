const CARDS: { kicker: string; title: string; description: string; blobClass: string }[] = [
  {
    kicker: "Align",
    title: "Where you align",
    description: "The answers you didn't even have to talk about to get right.",
    blobClass: "landing-card__blob--mint",
  },
  {
    kicker: "Differ",
    title: "Where you differ",
    description: "Different priorities aren't a red flag — they're something to explore together.",
    blobClass: "landing-card__blob--pink",
  },
  {
    kicker: "Talk about",
    title: "What to talk about",
    description:
      "A short list of moments worth a real conversation, picked out by your own answers.",
    blobClass: "landing-card__blob--blue",
  },
];

/**
 * "See where you're on the same wavelength" — the page's closing recap,
 * one beat before the shared LandingCtaSection. Reuses the exact 3-card
 * grid primitives the homepage's "How it works" section already
 * established (components/landing/landing-how-it-works.tsx:
 * .landing-card-grid / .landing-card / .landing-card__blob /
 * .landing-card__number / .landing-card__title / .landing-card__text)
 * rather than a new grid, so this recap and the homepage's own 3-card
 * section share one visual pattern instead of two similar-but-different
 * ones.
 */
export function ForCouplesSummary() {
  return (
    <section className="landing-section fc-summary">
      <p className="landing-eyebrow landing-eyebrow--plain">The recap</p>
      <h2 className="landing-section__heading">See where you&apos;re on the same wavelength</h2>
      <p className="landing-section__text">
        Every wavelength ends with the same three things to look at together.
      </p>

      <div className="landing-card-grid fc-summary__grid">
        {CARDS.map((card) => (
          <div className="landing-card" key={card.title}>
            <div className={`landing-card__blob ${card.blobClass}`} aria-hidden="true" />
            <p className="landing-card__number">{card.kicker}</p>
            <h3 className="landing-card__title">{card.title}</h3>
            <p className="landing-card__text">{card.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
