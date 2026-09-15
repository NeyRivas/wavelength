import Link from "next/link";

/**
 * Hero for /for-couples. Same visual language as the homepage hero
 * (components/landing/landing-hero.tsx) — eyebrow dots, Fraunces italic
 * heading, soft pastel blobs — but its own, centered composition: two
 * CTAs instead of one (a primary path into the product, and a secondary
 * path to /how-it-works for anyone who wants the mechanics first), and a
 * small three-node motif standing in for "two people, one shared thread"
 * rather than the homepage's larger side illustration. No stock
 * photography, no illustrated couple — the "for couples" framing lives
 * entirely in the copy and the motif, not in a picture of two people.
 */
export function ForCouplesHero() {
  return (
    <section className="landing-section fc-hero">
      <div className="fc-hero__shapes" aria-hidden="true">
        <div className="fc-hero__shape fc-hero__shape--lavender" />
        <div className="fc-hero__shape fc-hero__shape--mint" />
      </div>

      <div className="fc-hero__content">
        <p className="landing-eyebrow landing-eyebrow--plain fc-hero__eyebrow">
          <span className="landing-eyebrow__dot landing-eyebrow__dot--pink" aria-hidden="true" />
          <span className="landing-eyebrow__dot landing-eyebrow__dot--blue" aria-hidden="true" />
          For couples
        </p>

        <h1 className="landing-section__heading fc-hero__heading">
          There&apos;s always more to discover about each other.
        </h1>

        <p className="landing-section__text fc-hero__text">
          You know their coffee order, their go-to story, how they take a joke. Wavelength is a
          quick, private way to find the things you haven&apos;t talked about yet — no quiz score
          and no verdict, just a shared starting point for a real conversation.
        </p>

        <div className="fc-hero__actions">
          <Link href="/create" className="landing-button landing-button--primary">
            Create your wavelength <span aria-hidden="true">→</span>
          </Link>
          <Link href="/how-it-works" className="landing-button landing-button--outline">
            See how it works
          </Link>
        </div>

        <svg className="fc-hero__motif" viewBox="0 0 260 60" fill="none" aria-hidden="true">
          <path
            d="M20 30c30-20 60-20 90 0s60 20 90 0"
            stroke="var(--wl-muted)"
            strokeWidth="1.5"
            strokeDasharray="5 6"
          />
          <circle cx="20" cy="30" r="9" fill="#ffffff" stroke="var(--wl-pink)" strokeWidth="4" />
          <circle cx="20" cy="30" r="3.5" fill="var(--wl-ink)" />
          <circle
            cx="130"
            cy="16"
            r="7"
            fill="#ffffff"
            stroke="var(--wl-lavender)"
            strokeWidth="4"
          />
          <circle cx="130" cy="16" r="2.5" fill="var(--wl-ink)" />
          <circle cx="240" cy="30" r="9" fill="#ffffff" stroke="var(--wl-blue)" strokeWidth="4" />
          <circle cx="240" cy="30" r="3.5" fill="var(--wl-ink)" />
        </svg>
      </div>
    </section>
  );
}
