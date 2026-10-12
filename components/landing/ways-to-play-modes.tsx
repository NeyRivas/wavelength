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
    // /for-friends (app/for-friends/page.tsx) — the Friends-side
    // equivalent of /for-couples, added in this same pass so this card
    // can finally get a real secondary button instead of none at all.
    secondary: { label: "More about friends", href: "/for-friends" },
  },
];

/**
 * Each card's secondary button (`secondary` on its WAYS_TO_PLAY entry —
 * both cards have one now: /for-couples and /for-friends are each a
 * real, substantial informational page, components/landing/for-couples-*
 * and components/landing/for-friends-*) is a distinct, separately-
 * rendered <Link>, stacked below the primary CTA inside a dedicated
 * .wtp-mode-card__actions column — never merged into one link/button,
 * and never pointing at the same destination as the primary CTA above
 * it. Styled with .landing-button--outline (a real outlined pill, not
 * plain text) so it still reads as a proper button, just visually
 * quieter than `.landing-button--primary` next to it — the same outline
 * treatment already established by for-couples-hero.tsx's "See how it
 * works" link.
 *
 * Cleanup pass: the paragraph that used to sit below this grid ("Playing
 * with a partner? More on Sameeeish for couples — or get a taste of our
 * getting to know each other questions first.") is gone. It existed
 * only because /for-couples had no other way in before the Couples
 * card's own secondary button existed; now that both cards link to their
 * own real informational page directly, that paragraph was pure
 * duplication — same /for-couples destination the card's own button
 * already covers, and a getting-to-know-each-other-questions link that
 * belongs to that SEO page's own linking strategy, not this grid (see
 * app/play/dating-couples/getting-to-know-each-other-questions and
 * app/play/dating-couples/page.tsx for where that page is actually
 * linked from — not re-added here). The two cards are now the only
 * category-navigation elements in this section, each with exactly two
 * buttons: play the game, or learn more about the category first.
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
    </section>
  );
}
