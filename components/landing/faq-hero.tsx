/**
 * Intro hero for /faq (Figma reference: centered eyebrow, Fraunces italic
 * heading, one line of body text, soft pastel blobs top-left/top-right,
 * and a thin dashed trajectory line running behind the heading). Same
 * visual language as the other marketing pages' heroes
 * (components/landing/how-it-works-hero.tsx,
 * components/landing/for-couples-hero.tsx) — its own simpler composition,
 * no illustration, no CTA (the CTA for this page is the shared closing
 * LandingCtaSection further down).
 */
export function FaqHero() {
  return (
    <section className="landing-section faq-hero">
      <div className="faq-hero__shapes" aria-hidden="true">
        <div className="faq-hero__shape faq-hero__shape--lavender" />
        <div className="faq-hero__shape faq-hero__shape--mint" />
        <svg className="faq-hero__wave" viewBox="0 0 500 40" fill="none">
          <path
            d="M10 20c60-24 120-24 180 0s120 24 180 0 90-20 120-4"
            stroke="var(--wl-muted)"
            strokeWidth="1.5"
            strokeDasharray="5 6"
          />
        </svg>
        <span className="faq-hero__dot faq-hero__dot--pink" />
        <span className="faq-hero__dot faq-hero__dot--blue" />
      </div>

      <div className="faq-hero__content">
        <p className="landing-eyebrow landing-eyebrow--plain faq-hero__eyebrow">FAQ</p>
        <h1 className="landing-section__heading faq-hero__heading">Questions, answered.</h1>
        <p className="landing-section__text faq-hero__text">
          Everything you need to know before you get started.
        </p>
      </div>
    </section>
  );
}
