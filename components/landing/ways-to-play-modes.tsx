import Link from "next/link";

interface WayToPlay {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  blobClass: string;
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
  },
  {
    id: "friends",
    title: "For friends",
    description:
      "For friends who want to see where they think alike — and where they don't. No score, just a shared starting point for a real conversation.",
    ctaLabel: "Play with friends",
    href: "/play/friends",
    blobClass: "landing-card__blob--blue",
  },
];

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
          than inventing a new button style. */}
      <p className="wtp-modes__more">
        Playing with a partner?{" "}
        <Link href="/for-couples" className="landing-button landing-button--outline">
          More on Sameeeish for couples
        </Link>
      </p>
    </section>
  );
}
