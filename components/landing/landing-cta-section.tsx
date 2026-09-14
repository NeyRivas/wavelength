import Link from "next/link";

const DOT_CLASSES = [
  "landing-dot--lavender",
  "landing-dot--blue",
  "landing-dot--pink",
  "landing-dot--mint",
  "landing-dot--peach",
];

/** The dark closing CTA band (Figma reference, screenshot 4, top half —
 * the white footer below it is LandingFooter). Same /create destination
 * as every other CTA on this page. */
export function LandingCtaSection() {
  return (
    <section className="landing-dark-cta">
      <div className="landing-dark-cta__shapes" aria-hidden="true">
        <div className="dark-shape dark-shape--1" />
        <div className="dark-shape dark-shape--2" />
        <div className="dark-shape dark-shape--3" />
      </div>

      <div className="landing-dark-cta__content">
        <h2 className="landing-dark-cta__heading">Find your wavelength.</h2>
        <p className="landing-dark-cta__description">
          It only takes a few minutes. You might learn something new about someone you&apos;ve known
          for years.
        </p>
        <Link href="/create" className="landing-button landing-button--light">
          Create your wavelength <span aria-hidden="true">→</span>
        </Link>
        <div className="landing-dot-row" aria-hidden="true">
          {DOT_CLASSES.map((c) => (
            <span key={c} className={`landing-dot ${c}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
