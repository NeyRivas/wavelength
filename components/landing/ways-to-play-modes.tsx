import Link from "next/link";

interface WayToPlay {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  blobClass: string;
  /** A genuine informational page about this category, distinct from
   * the primary CTA's game destination above — omitted entirely when no
   * such page exists (see the Friends entry below and this file's own
   * WaysToPlayModes doc comment) rather than pointing at the same
   * destination as the primary button or at an unrelated page. */
  secondary?: { label: string; href: string };
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
    secondary: { label: "More about couples", href: "/for-couples" },
  },
  {
    id: "friends",
    title: "For friends",
    description:
      "For friends who want to see where they think alike — and where they don't. No score, just a shared starting point for a real conversation.",
    ctaLabel: "Play with friends",
    href: "/play/friends",
    blobClass: "landing-card__blob--blue",
    // No `secondary` here: unlike /for-couples (a real, substantial
    // informational page — components/landing/for-couples-*), there is
    // no equivalent informational page for Friends anywhere in the app
    // (confirmed by inspecting app/ and grepping the codebase for
    // "for-friends"/"ForFriends"/etc. — nothing exists). /play/friends
    // is the game listing itself, the same place the primary CTA above
    // already goes, so reusing it as a "secondary" destination would
    // violate the explicit instruction this fix is addressing. Rather
    // than inventing a page or misusing an unrelated one (About, FAQ),
    // this card simply keeps its one primary button until a real Friends
    // informational page exists.
  },
];

/**
 * Fix pass: each card's secondary button (when `secondary` is set — see
 * WAYS_TO_PLAY above) is a distinct, separately-rendered <Link>, stacked
 * below the primary CTA inside a dedicated .wtp-mode-card__actions
 * column — never merged into one link/button, and never pointing at the
 * same destination as the primary CTA above it. Styled with
 * .landing-button--outline (a real outlined pill, not plain text) so it
 * still reads as a proper button, just visually quieter than
 * `.landing-button--primary` next to it — the same outline treatment
 * already established by for-couples-hero.tsx's "See how it works" link
 * and the /for-couples link below this grid, not a new button style.
 * Conditional: the Friends card has no `secondary` entry at all (no
 * genuine informational page exists for it — see that entry's own
 * comment), so it simply renders with one button, same as every card did
 * before any of this linking work started.
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
            <div className="wtp-mode-card__actions">
              <Link
                href={mode.href}
                className="landing-button landing-button--primary landing-button--play"
              >
                {mode.ctaLabel} <span aria-hidden="true">→</span>
              </Link>
              {mode.secondary && (
                <Link href={mode.secondary.href} className="landing-button landing-button--outline">
                  {mode.secondary.label}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* SEO pass: a contextual link to /for-couples — a real, substantial
          page (components/landing/for-couples-*). Originally placed here,
          below the two-card grid, specifically to avoid breaking the
          cards' "equal pair" parity by adding a second link to only one
          of them (see this file's own WAYS_TO_PLAY comment and
          .wtp-mode-card's CSS comment: "same card style, same button
          style, same order weight"). A fix pass later added the Couples
          card its own "More about couples" button pointing at this same
          /for-couples page (Friends has no equivalent informational page
          to match it with, so it stays without a second button — see
          that entry's own comment) — intentionally not removed or merged
          with this one: this is a page-level aside reachable regardless
          of which card a visitor is looking at, the card's own button is
          a card-level action; two entry points to the same real page
          from different contexts isn't a conflict. Reuses
          .landing-button--outline verbatim (already established by
          for-couples-hero.tsx's own "See how it works" link) rather than
          inventing a new button style.

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
