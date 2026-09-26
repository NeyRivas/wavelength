/**
 * Intro hero for /ways-to-play (same simple pattern as the other
 * non-illustrated marketing heroes: components/landing/faq-hero.tsx,
 * components/landing/how-it-works-hero.tsx — centered eyebrow, Fraunces
 * italic heading, one line of body text, soft pastel blobs, a thin dashed
 * trajectory line). No CTA here — the two "ways to play" cards further
 * down (ways-to-play-modes.tsx) are the actual entry points, and the
 * shared closing LandingCtaSection still closes the page like every
 * other marketing route.
 */
export function WaysToPlayHero() {
  return (
    <section className="landing-section wtp-hero">
      <div className="wtp-hero__shapes" aria-hidden="true">
        <div className="wtp-hero__shape wtp-hero__shape--lavender" />
        <div className="wtp-hero__shape wtp-hero__shape--mint" />
        <svg className="wtp-hero__wave" viewBox="0 0 500 40" fill="none">
          <path
            d="M10 20c60-24 120-24 180 0s120 24 180 0 90-20 120-4"
            stroke="var(--wl-muted)"
            strokeWidth="1.5"
            strokeDasharray="5 6"
          />
        </svg>
        <span className="wtp-hero__dot wtp-hero__dot--pink" />
        <span className="wtp-hero__dot wtp-hero__dot--blue" />
      </div>

      <div className="wtp-hero__content">
        <p className="landing-eyebrow landing-eyebrow--plain wtp-hero__eyebrow">For everyone</p>
        <h1 className="landing-section__heading wtp-hero__heading">Ways to play</h1>
        <p className="landing-section__text wtp-hero__text">
          One shared set of questions, made for however you play — couples, friends, or anyone
          curious to compare notes.
        </p>
      </div>
    </section>
  );
}
