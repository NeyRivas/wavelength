import Link from "next/link";

import { CatalogCardLink } from "@/components/play/catalog";
import { CATALOG_SECTIONS, MAKE_YOUR_OWN } from "@/lib/wavelength/catalog";

/**
 * Home page game shelf: every ready-made game as its cover, straight from
 * the same catalog data and card component /play uses, so the two can
 * never drift apart. Replaces the old text-and-pills "experience" block;
 * the hero above already demonstrates what a question feels like.
 */
export function LandingGames() {
  const cards = CATALOG_SECTIONS.flatMap((section) => section.cards);

  return (
    <section className="op-section op-games" aria-labelledby="games-heading">
      <div className="op-games__header">
        <h2 id="games-heading" className="op-section__heading">
          Pick a game
        </h2>
        <p className="op-section__lede">For couples, for friends, or write your own questions.</p>
      </div>
      <ul className="op-games__grid">
        {cards.map((card) => (
          <li key={card.gameId}>
            <CatalogCardLink card={card} />
          </li>
        ))}
      </ul>
      <p className="op-games__own">
        <Link href={MAKE_YOUR_OWN.href} className="op-link">
          Or make your own game
        </Link>
      </p>
    </section>
  );
}
