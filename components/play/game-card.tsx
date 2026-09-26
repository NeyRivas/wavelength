import { startReadyMadeGame } from "@/app/actions/ready-made-games";

/**
 * One ready-made game card, used on /play's category screens
 * (/play/dating-couples, /play/friends). `playable` games submit
 * `startReadyMadeGame` (app/actions/ready-made-games.ts) via a form whose
 * submit button IS the card (`display: contents` on the form itself keeps
 * the button as the actual grid item — see .game-card-form in
 * globals.css), so the whole card is clickable, not just the "Play"
 * label. Non-playable games render the identical markup/styling as a
 * plain, inert block — same card design, no second visual system, just
 * not wired to a real question set yet.
 */
export function GameCard({
  id,
  title,
  blobClass,
  playable,
}: {
  id: string;
  title: string;
  blobClass: string;
  playable: boolean;
}) {
  const inner = (
    <>
      <div className={`landing-card__blob ${blobClass}`} aria-hidden="true" />
      <h2 className="game-card__title">{title}</h2>
      <span className="game-card__cta">
        Play <span aria-hidden="true">→</span>
      </span>
    </>
  );

  if (!playable) {
    return (
      <div className="landing-card game-card game-card--inert" aria-disabled="true">
        {inner}
      </div>
    );
  }

  return (
    <form action={startReadyMadeGame} className="game-card-form">
      <input type="hidden" name="gameId" value={id} />
      <button type="submit" className="landing-card game-card">
        {inner}
      </button>
    </form>
  );
}
