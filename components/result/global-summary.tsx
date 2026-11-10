import type { AlignmentLevel } from "@/lib/scoring/score";
import { ALIGNMENT_INTERPRETATION } from "@/lib/wavelength/result";

import { AlignmentBadge } from "./alignment-badge";
import { WavelengthIndicator } from "./wavelength-indicator";

/** Per-game eyebrow/heading (global QA/copy pass item #2/#13) — keyed by
 * lib/wavelength/ready-made-games.ts's own ids. Falls back to the
 * original, fully generic copy for Make Your Own (no known id) or any
 * future game that reuses this same default compatibility-style result
 * without its own entry here. */
const COPY_BY_GAME_ID: Record<
  string,
  { eyebrow: string; heading: (aliasA: string, aliasB: string) => string }
> = {
  "how-well-do-you-know-each-other": {
    eyebrow: "Your compatibility result",
    heading: (aliasA, aliasB) => `Are ${aliasA} and ${aliasB} on the same page?`,
  },
  "getting-to-know-you": {
    eyebrow: "Your discovery result",
    heading: (aliasA, aliasB) => `What ${aliasA} and ${aliasB} discovered about each other`,
  },
};

const DEFAULT_COPY = {
  eyebrow: "Your result",
  heading: (aliasA: string, aliasB: string) => `How ${aliasA} and ${aliasB} compare`,
};

/**
 * The percentage is secondary to the concept — the heading asks the
 * question the product is about, the wave visual and level badge carry
 * the answer first, and the number is a smaller supporting stat. The
 * interpretation sentence (lib/wavelength/result.ts) gets the more
 * emotive display treatment instead, since it's the actual human meaning
 * of the result — deliberately never framed as scientific, predictive,
 * diagnostic, or statistically validated.
 *
 * Presentation-only reordering of the exact same props/data this
 * component always received (`score`/`level` still come straight from
 * `view.global`, untouched) — badge now renders before the percentage
 * (previously after), and both gained their own classes for the reveal's
 * visual hierarchy. No new content, no computed value changed.
 *
 * Visual-signature pass: this is the one "glass" moment on Results (the
 * brief's "global result card" / "wavelength visualization container" /
 * "result summary" — one cohesive panel rather than three separate
 * nested glass layers, to keep hierarchy clear: this is the only prolonged
 * glass surface on the page besides the secondary action buttons). The
 * ambient blobs behind it give the glass something living to show
 * through, mirroring the same technique the Hero and Experience sections
 * use — the same visual signature carried into Results.
 *
 * Bug-fix pass: the heading names both participants by their actual
 * aliases rather than the generic "you" framing — real names everywhere
 * identity is shown, never the bare "A"/"B" internal labels.
 *
 * Typography cleanup pass: dropped the animated SAMEEEISH/SAMEEE inline
 * flourish that used to sit below the interpretation line (components/
 * result/sameeeish-reveal.tsx — now deleted, nothing else used it once
 * every result card stopped). `ALIGNMENT_INTERPRETATION` never names
 * either participant (it's a level-only sentence), so there's no alias to
 * emphasize here the way GuessAccuracySummary/FriendshipMemorySummary do
 * in their own interpretation line — this card's "participant name" tier
 * is the heading above, already carrying both aliases, untouched. The
 * interpretation sentence itself still moved, along with theirs, onto the
 * plain UI/body typeface (`.global-summary__interpretation`, app/
 * globals.css) instead of the display italic it used to share with the
 * heading — calmer, more readable, nothing new to animate.
 */
export function GlobalSummary({
  score,
  level,
  aliasA,
  aliasB,
  gameId,
}: {
  score: number;
  level: AlignmentLevel;
  aliasA: string;
  aliasB: string;
  gameId?: string;
}) {
  const copy = (gameId && COPY_BY_GAME_ID[gameId]) || DEFAULT_COPY;

  return (
    <section className="global-summary" aria-labelledby="global-summary-heading">
      <div className="global-summary__ambient" aria-hidden="true">
        <div className="global-summary__ambient-blob global-summary__ambient-blob--a" />
        <div className="global-summary__ambient-blob global-summary__ambient-blob--b" />
      </div>

      <div className="global-summary__glass">
        <p className="global-summary__eyebrow">{copy.eyebrow}</p>
        <h1 id="global-summary-heading" className="global-summary__heading">
          {copy.heading(aliasA, aliasB)}
        </h1>
        <WavelengthIndicator score={score} level={level} />
        <AlignmentBadge level={level} />
        <p className="global-summary__score">{score}% aligned</p>
        <p className="global-summary__interpretation">{ALIGNMENT_INTERPRETATION[level]}</p>
      </div>
    </section>
  );
}
