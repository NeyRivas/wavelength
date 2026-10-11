const STEPS: {
  number: string;
  title: string;
  description: string;
  blobClass: string;
  vividClass: string;
}[] = [
  {
    number: "01",
    title: "Create",
    description:
      "Pick your questions and answer them honestly. No second-guessing — go with your gut.",
    blobClass: "landing-card__blob--pink",
    vividClass: "game-card--vivid-a",
  },
  {
    number: "02",
    title: "Share",
    description: "Send the link to someone. They answer the same questions independently.",
    blobClass: "landing-card__blob--blue",
    vividClass: "game-card--vivid-b",
  },
  {
    number: "03",
    title: "Discover",
    description: "See where your answers line up — and where you're completely different.",
    blobClass: "landing-card__blob--mint",
    vividClass: "game-card--vivid-c",
  },
];

/** "How it works" (Figma reference, screenshot 2) — three numbered cards,
 * each with a single decorative shape bleeding off its top-right corner.
 * `id="how-it-works"` is the header's real in-page anchor target.
 *
 * Card visual-reuse pass: these cards now carry the exact same
 * `.game-card`/`.game-card--vivid*` classes the Dating & Couples ready-made
 * game cards use (components/play/game-card.tsx) — same gradient fills,
 * translucent blob/corner-glow treatment, lift+shadow hover, and glass-less
 * ink typography, reusing that CSS wholesale rather than approximating it.
 * `blobClass`/`vividClass` pair up index-for-index exactly like
 * GameCategorySection's own "dating-couples" group (pink↔a, blue↔b,
 * mint↔c — see BLOBS_BY_GROUP/VIVID_GRADIENT_BY_GAME_ID in
 * components/play/game-category-section.tsx) for the same reason: it's the
 * established pairing, not a new one. `game-card--inert` (the same
 * modifier GameCard already applies to its own non-playable cards) keeps
 * the cursor a plain default, since these three are presentational steps,
 * not links or buttons — no `aria-disabled`, since unlike an inert
 * GameCard these were never actionable to begin with. Number/title/
 * description text, order, and content are entirely unchanged. */
export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="landing-section landing-how">
      <p className="landing-eyebrow landing-eyebrow--plain">The game</p>
      <h2 className="landing-section__heading">How it works</h2>

      <div className="landing-card-grid">
        {STEPS.map((step) => (
          <div
            className={`landing-card game-card game-card--inert game-card--vivid ${step.vividClass}`}
            key={step.number}
          >
            <div className={`landing-card__blob ${step.blobClass}`} aria-hidden="true" />
            <p className="landing-card__number">{step.number}</p>
            <h3 className="landing-card__title">{step.title}</h3>
            <p className="landing-card__text">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
