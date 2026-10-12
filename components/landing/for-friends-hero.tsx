import Link from "next/link";

/**
 * Intro hero for /for-friends — same simple, non-illustrated pattern as
 * faq-hero.tsx/ways-to-play-hero.tsx (centered eyebrow, Fraunces italic
 * heading, one line of body text, soft pastel blobs, a thin dashed
 * trajectory line, exact same shape/dot values), plus its own two-button
 * actions row (same .fc-hero__actions-style layout for-couples-hero.tsx
 * already established: a primary path into the product and a secondary
 * path to /how-it-works) since this page, unlike FAQ/Ways to Play, needs
 * its own clear CTA rather than relying only on the shared closing
 * LandingCtaSection further down.
 */
export function ForFriendsHero() {
  return (
    <section className="landing-section ff-hero">
      <div className="ff-hero__shapes" aria-hidden="true">
        <div className="ff-hero__shape ff-hero__shape--lavender" />
        <div className="ff-hero__shape ff-hero__shape--mint" />
        <svg className="ff-hero__wave" viewBox="0 0 500 40" fill="none">
          <path
            d="M10 20c60-24 120-24 180 0s120 24 180 0 90-20 120-4"
            stroke="var(--wl-muted)"
            strokeWidth="1.5"
            strokeDasharray="5 6"
          />
        </svg>
        <span className="ff-hero__dot ff-hero__dot--pink" />
        <span className="ff-hero__dot ff-hero__dot--blue" />
      </div>

      <div className="ff-hero__content">
        <p className="landing-eyebrow landing-eyebrow--plain ff-hero__eyebrow">For friends</p>
        <h1 className="landing-section__heading ff-hero__heading">
          How well do you actually know your friends?
        </h1>
        <p className="landing-section__text ff-hero__text">
          Two ready-made games built for the two of you — one about you, one about your friendship.
          You answer first, then your friend tries to guess what you said.
        </p>

        <div className="ff-hero__actions">
          <Link
            href="/play/friends"
            className="landing-button landing-button--primary landing-button--play"
          >
            Play with friends <span aria-hidden="true">→</span>
          </Link>
          <Link href="/how-it-works" className="landing-button landing-button--outline">
            See how it works
          </Link>
        </div>
      </div>
    </section>
  );
}
