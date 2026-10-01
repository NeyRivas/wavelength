import Link from "next/link";

import { startReadyMadeGame } from "@/app/actions/ready-made-games";

/**
 * One ready-made game card, used on /play's category screens
 * (/play/dating-couples, /play/friends). Three possible renderings:
 * - `href` set (e.g. Date Night) → plain navigation (a Link) to a
 *   standalone experience, not a questionnaire draft — takes priority
 *   over `playable`.
 * - `playable` (has a real question set) → submits `startReadyMadeGame`
 *   (app/actions/ready-made-games.ts) via a form whose submit button IS
 *   the card (`display: contents` on the form itself keeps the button as
 *   the actual grid item — see .game-card-form in globals.css), so the
 *   whole card is clickable, not just the "Play" label.
 * - neither → identical markup/styling as a plain, inert block — same
 *   card design, no second visual system, just not wired up yet.
 */
export function GameCard({
  id,
  title,
  subtitle,
  blobClass,
  playable,
  href,
}: {
  id: string;
  title: string;
  subtitle?: string;
  blobClass: string;
  playable: boolean;
  href?: string;
}) {
  const inner = (
    <>
      <div className={`landing-card__blob ${blobClass}`} aria-hidden="true" />
      <h2 className="game-card__title">
        {title}
        {subtitle && <span className="game-card__subtitle">{subtitle}</span>}
      </h2>
      <span className="game-card__cta">
        Play <span aria-hidden="true">→</span>
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="landing-card game-card">
        {inner}
      </Link>
    );
  }

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
