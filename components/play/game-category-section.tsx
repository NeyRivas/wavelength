import { GameCard } from "./game-card";
import { READY_MADE_GAMES, type ReadyMadeGameGroup } from "@/lib/wavelength/ready-made-games";

const BLOBS_BY_GROUP: Record<ReadyMadeGameGroup, string[]> = {
  "dating-couples": [
    "landing-card__blob--pink",
    "landing-card__blob--blue",
    "landing-card__blob--mint",
  ],
  friends: ["landing-card__blob--lavender", "landing-card__blob--peach"],
};

/**
 * One /play category screen's game list (/play/dating-couples,
 * /play/friends) — reuses the exact section/heading/grid/card primitives
 * the old landing "Pick a game" section used (.landing-section,
 * .landing-section__heading, .landing-card-grid, GameCard), just as a
 * full page's own content instead of a sub-block nested under a shared
 * "Pick a game" heading. Which games belong to which group, and which of
 * them actually has a real question set, both come straight from
 * lib/wavelength/ready-made-games.ts — nothing about that data changed.
 */
export function GameCategorySection({
  group,
  heading,
  text,
}: {
  group: ReadyMadeGameGroup;
  heading: string;
  text: string;
}) {
  const games = READY_MADE_GAMES.filter((game) => game.group === group);
  const blobs = BLOBS_BY_GROUP[group];
  const gridClassName =
    games.length === 2
      ? "landing-card-grid game-card-grid game-card-grid--two"
      : "landing-card-grid game-card-grid";

  return (
    <section className="landing-section landing-how play-category">
      <h1 className="landing-section__heading">{heading}</h1>
      <p className="landing-section__text">{text}</p>
      <div className={gridClassName}>
        {games.map((game, index) => (
          <GameCard
            key={game.id}
            id={game.id}
            title={game.title}
            blobClass={blobs[index]!}
            playable={game.questions !== null}
          />
        ))}
      </div>
    </section>
  );
}
