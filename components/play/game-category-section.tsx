import { GameCard } from "./game-card";
import { READY_MADE_GAMES, type ReadyMadeGameGroup } from "@/lib/wavelength/ready-made-games";

const BLOBS_BY_GROUP: Record<ReadyMadeGameGroup, string[]> = {
  "dating-couples": [
    "landing-card__blob--pink",
    "landing-card__blob--blue",
    "landing-card__blob--mint",
    "landing-card__blob--peach",
  ],
  friends: ["landing-card__blob--lavender", "landing-card__blob--peach"],
};

/** Dating & Couples visual-refresh pass, extended (by game id rather than
 * by position) to both Friends games now that they're playable too — same
 * approved gradient classes (game-card--vivid-a/b/c — see app/globals.css),
 * no new styles. Explicit opt-in per game id: a game absent from this map
 * keeps rendering as a plain, inert card exactly as before. */
const VIVID_GRADIENT_BY_GAME_ID: Partial<Record<string, string>> = {
  "how-well-do-you-know-each-other": "game-card--vivid-a",
  "getting-to-know-you": "game-card--vivid-b",
  "date-night": "game-card--vivid-c",
  "36-questions-to-fall-in-love": "game-card--vivid-d",
  "how-well-do-you-know-me": "game-card--vivid-a",
  "friendship-check": "game-card--vivid-b",
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
 *
 * Visual-refinement pass: the section also carries a `play-category--
 * ${group}` modifier class (derived from the `group` prop this component
 * already receives, not a new prop) so /play/dating-couples' own
 * alignment/spacing tweaks (app/globals.css) can target it alone without
 * touching this shared component's markup/behavior or /play/friends,
 * which gets its own unused `play-category--friends` class and no
 * matching CSS.
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
      : games.length === 4
        ? "landing-card-grid game-card-grid game-card-grid--four"
        : "landing-card-grid game-card-grid";

  return (
    <section className={`landing-section landing-how play-category play-category--${group}`}>
      <h1 className="landing-section__heading">{heading}</h1>
      <p className="landing-section__text">{text}</p>
      <div className={gridClassName}>
        {games.map((game, index) => (
          <GameCard
            key={game.id}
            id={game.id}
            title={game.title}
            subtitle={game.subtitle}
            description={game.description}
            blobClass={blobs[index]!}
            playable={game.questions !== null}
            href={game.href}
            vividClass={VIVID_GRADIENT_BY_GAME_ID[game.id]}
            secondary={game.secondary}
          />
        ))}
      </div>
    </section>
  );
}
