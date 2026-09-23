const STEPS: { number: string; title: string; description: string; blobClass: string }[] = [
  {
    number: "01",
    title: "Create",
    description:
      "Pick your questions and answer them honestly. No second-guessing — go with your gut.",
    blobClass: "landing-card__blob--pink",
  },
  {
    number: "02",
    title: "Share",
    description: "Send the link to someone. They answer the same questions independently.",
    blobClass: "landing-card__blob--blue",
  },
  {
    number: "03",
    title: "Discover",
    description: "See where your answers line up — and where you're completely different.",
    blobClass: "landing-card__blob--mint",
  },
];

/** "How it works" (Figma reference, screenshot 2) — three numbered cards,
 * each with a single decorative shape bleeding off its top-right corner.
 * `id="how-it-works"` is the header's real in-page anchor target. */
export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="landing-section landing-how">
      <p className="landing-eyebrow landing-eyebrow--plain">The game</p>
      <h2 className="landing-section__heading">How it works</h2>

      <div className="landing-card-grid">
        {STEPS.map((step) => (
          <div className="landing-card" key={step.number}>
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
