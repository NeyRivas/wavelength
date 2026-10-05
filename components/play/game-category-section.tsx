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

/** Dating & Couples visual-refresh pass, extended (by game id rather than
 * by position) to the one Friends game that's actually playable now too —
 * same approved gradient classes (game-card--vivid-a/b/c — see
 * app/globals.css), no new styles. Explicit opt-in per game id: a game
 * absent from this map (e.g. "friendship-check", still unplayable) keeps
 * rendering as a plain, inert card exactly as before. */
const VIVID_GRADIENT_BY_GAME_ID: Partial<Record<string, string>> = {
  "how-well-do-you-know-each-other": "game-card--vivid-a",
  "getting-to-know-you": "game-card--vivid-b",
  "date-night": "game-card--vivid-c",
  "how-well-do-you-know-me": "game-card--vivid-a",
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
            subtitle={game.subtitle}
            blobClass={blobs[index]!}
            playable={game.questions !== null}
            href={game.href}
            vividClass={VIVID_GRADIENT_BY_GAME_ID[game.id]}
          />
        ))}
      </div>
    </section>
  );
}
