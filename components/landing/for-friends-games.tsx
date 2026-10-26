import Link from "next/link";

import { READY_MADE_GAMES } from "@/lib/wavelength/ready-made-games";

const BLOB_CLASS_BY_GAME_ID: Record<string, string> = {
  "how-well-do-you-know-me": "landing-card__blob--lavender",
  "friendship-check": "landing-card__blob--peach",
};

/**
 * "The two games" — names the real Friends games from
 * lib/wavelength/ready-made-games.ts (filtered by group === "friends")
 * rather than re-typing their titles/descriptions here a second time, so
 * this section can't drift out of sync with the actual product the way a
 * hand-written copy of game names could. `title` and `builderSubtitle`
 * are both already-approved product copy (builderSubtitle is the same
 * line /create's own builder screen shows for each game) — nothing
 * invented for this page. Reuses the exact .landing-card-grid/
 * .landing-card primitives every other 2-or-3-item grid in the app
 * already uses (WaysToPlayModes, ForCouplesSummary), with the same
 * lavender/peach blob tints GameCategorySection's own BLOBS_BY_GROUP
 * already assigns to these two games on /play/friends.
 *
 * Each card links to its game's experience page (the game's `href`), so
 * this informational page leads straight to both games.
 */
export function ForFriendsGames() {
  const friendsGames = READY_MADE_GAMES.filter((game) => game.group === "friends");

  return (
    <section className="landing-section landing-how ff-games">
      <p className="landing-eyebrow landing-eyebrow--plain">The two games</p>
      <h2 className="landing-section__heading">Pick a way to test each other</h2>
      <p className="landing-section__text">
        Both work the same way: one of you answers first, then the other guesses.
      </p>

      <div className="landing-card-grid ff-games__grid">
        {friendsGames.map((game) => (
          <Link
            href={game.href ?? "/play/friends"}
            className="landing-card ff-games__card"
            key={game.id}
          >
            <div
              className={`landing-card__blob ${BLOB_CLASS_BY_GAME_ID[game.id] ?? "landing-card__blob--blue"}`}
              aria-hidden="true"
            />
            <h3 className="landing-card__title">{game.title}</h3>
            {game.builderSubtitle && <p className="landing-card__text">{game.builderSubtitle}</p>}
            <span className="ff-games__go">
              See how it works <span aria-hidden="true">→</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
