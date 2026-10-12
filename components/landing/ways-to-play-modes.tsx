import Link from "next/link";

interface WayToPlay {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  blobClass: string;
  /** Secondary-link label (e.g. "More about couples") — shares `href`
   * with the primary CTA above it (see WaysToPlayModes' own doc comment
   * on why that's intentional, not a mistake) rather than a second,
   * separately-maintained destination field. */
  secondaryLabel: string;
}

/**
 * The two currently-available experiences. Deliberately a plain data
 * array rendered with .map() — adding a third way to play later (or a
 * fourth) is adding one more entry here, not redesigning this section.
 * No ranking of any kind: same card style, same button style, same
 * order weight for both — "For couples" isn't primary and "For friends"
 * isn't secondary.
 */
const WAYS_TO_PLAY: WayToPlay[] = [
  {
    id: "couples",
    title: "For couples",
    description:
      "For couples, or for two people just getting to know each other — a quick, private way to find out what you haven't talked about yet.",
    ctaLabel: "Play for couples",
    href: "/play/dating-couples",
    blobClass: "landing-card__blob--pink",
    secondaryLabel: "More about couples",
  },
  {
    id: "friends",
    title: "For friends",
    description:
      "For friends who want to see where they think alike — and where they don't. No score, just a shared starting point for a real conversation.",
    ctaLabel: "Play with friends",
    href: "/play/friends",
    blobClass: "landing-card__blob--blue",
    secondaryLabel: "More about friends",
  },
];

/**
 * Each card's own secondary link (below this component's definition —
 * see WaysToPlayModes) adds a quieter, text-only way into the same
 * destination the primary CTA already points to: "Play for couples" and
 * "More about couples" both go to /play/dating-couples, "Play with
 * friends" and "More about friends" both go to /play/friends. Both cards
 * get this symmetrically (not just one), so it doesn't touch the
 * established "equal pair" parity above (see WAYS_TO_PLAY's own
 * comment) — unlike the single, deliberately one-sided /for-couples link
 * below the grid. Reuses .landing-back-link verbatim (the same small,
 * muted, no-background treatment already used for "← Back" and the
 * getting-to-know-each-other-questions page's own secondary link) rather
 * than a second pill button, so it reads as clearly quieter than
 * `.landing-button--primary` above it.
 */
export function WaysToPlayModes() {
  return (
    <section className="landing-section landing-how wtp-modes">
      <div className="landing-card-grid wtp-modes__grid">
        {WAYS_TO_PLAY.map((mode) => (
          <div className="landing-card wtp-mode-card" key={mode.id}>
            <div className={`landing-card__blob ${mode.blobClass}`} aria-hidden="true" />
            <h2 className="landing-card__title">{mode.title}</h2>
            <p className="landing-card__text wtp-mode-card__text">{mode.description}</p>
            <Link
              href={mode.href}
              className="landing-button landing-button--primary landing-button--play"
            >
              {mode.ctaLabel} <span aria-hidden="true">→</span>
            </Link>
            <Link href={mode.href} className="landing-back-link wtp-mode-card__more">
              {mode.secondaryLabel}
            </Link>
          </div>
        ))}
      </div>

      {/* SEO pass: a single contextual link to /for-couples — a real,
          substantial page (components/landing/for-couples-*) that has no
          other internal link pointing to it anywhere in the app (its old
          nav entry was deliberately retired in favor of this page, see
          landing-header.tsx's own doc comment; not restored here).
          Deliberately placed below the two-card grid rather than as a
          second link on the "For couples" card itself — that card and
          "For friends" are an intentionally equal pair (see this file's
          own WAYS_TO_PLAY comment and .wtp-mode-card's CSS comment:
          "same card style, same button style, same order weight"), so a
          second link would only break that parity for one of the two.
          Reuses .landing-button--outline verbatim (already established
          by for-couples-hero.tsx's own "See how it works" link) rather
          than inventing a new button style.

          Internal-linking pass: a second link to the
          /play/dating-couples/getting-to-know-each-other-questions SEO
          landing page was added to this same paragraph rather than as a
          new block below it — one more full-width centered line here
          would start to read as a stacked promotional section, not a
          single contextual aside. Styled as plain underlined text
          (.wtp-modes__more-link), not a second pill button, so it stays
          visually secondary to the one outline CTA above and to the two
          cards' own primary buttons. Descriptive anchor text ("getting to
          know each other questions"), not generic "click here". */}
      <p className="wtp-modes__more">
        Playing with a partner?{" "}
        <Link href="/for-couples" className="landing-button landing-button--outline">
          More on Sameeeish for couples
        </Link>{" "}
        — or get a taste of our{" "}
        <Link
          href="/play/dating-couples/getting-to-know-each-other-questions"
          className="wtp-modes__more-link"
        >
          getting to know each other questions
        </Link>{" "}
        first.
      </p>
    </section>
  );
}
