/**
 * Intro hero for /how-it-works. Deliberately not a copy of the homepage
 * hero (components/landing/landing-hero.tsx) — same visual language
 * (eyebrow dots, Fraunces italic heading, Nunito Sans body) but its own,
 * simpler composition (centered, no side illustration) so this page reads
 * as a continuation of the brand rather than a re-run of "/".
 *
 * `id="how-it-works"` gives the header's "How it works" nav link
 * (components/landing/landing-header.tsx, unmodified) something to
 * scroll to on this page too — on "/" it points at the 3-card section's
 * own id of the same name; here it resolves to the top of this page's
 * own how-it-works content. No change to the shared header was needed.
 */
export function HowItWorksHero() {
  return (
    <section id="how-it-works" className="landing-section hiw-hero">
      <p className="landing-eyebrow hiw-hero__eyebrow">
        <span className="landing-eyebrow__dot landing-eyebrow__dot--pink" aria-hidden="true" />
        <span className="landing-eyebrow__dot landing-eyebrow__dot--blue" aria-hidden="true" />
        The process
      </p>

      <h1 className="landing-section__heading hiw-hero__heading">How it works</h1>

      <p className="landing-section__text hiw-hero__text">
        One of you creates a set of questions and answers them first. Share the link, they answer
        the same questions on their own, and Wavelength shows you where you line up — and where you
        don&apos;t.
      </p>

      <svg className="hiw-hero__wave" viewBox="0 0 320 60" fill="none" aria-hidden="true">
        <circle cx="24" cy="30" r="9" fill="#ffffff" stroke="var(--wl-pink)" strokeWidth="4" />
        <circle cx="24" cy="30" r="3.5" fill="var(--wl-ink)" />
        <path
          d="M40 30c20-22 40-22 60 0s40 22 60 0 40-22 60 0 40 22 60 0"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="296" cy="30" r="9" fill="#ffffff" stroke="var(--wl-blue)" strokeWidth="4" />
        <circle cx="296" cy="30" r="3.5" fill="var(--wl-ink)" />
      </svg>
    </section>
  );
}
