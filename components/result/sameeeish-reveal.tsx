/**
 * The one shared brand reaction — the word SAMEEEISH! building in letter
 * by letter — reused as both the result-reveal transition (components/
 * result/result-reveal.tsx, a full "hero" moment before the real result
 * shows) and the small decorative flourish on the result itself
 * (GuessAccuracySummary, FriendshipMemorySummary, GlobalSummary — an
 * "inline" moment, replacing the old sparkles/particles reaction). Same
 * word, same timing, same palette in both places on purpose — "part of
 * the same visual system," not two different animations that happen to
 * share a name.
 *
 * `celebrate` (derived upstream from each result's own already-computed
 * tier/level — never recomputed here) decides which word it builds to:
 * - `false` (the default/most results): the full build, S → SA → SAM →
 *   … → SAMEEEISH!, with the trailing "ISH" getting a subtle emphasis
 *   (slightly bigger, a soft gradient fill, a faint glow) while staying
 *   part of the one word — never a visually separate "SAMEEE + ISH".
 * - `true` (a high-tier/high-alignment result): stops short, at SAMEEE!
 *   — a snappier, more celebratory beat, in the same approved-palette
 *   gradient fill as the "ISH" emphasis above, reusing that same "this
 *   moment is special" visual language rather than inventing a second one.
 *
 * Purely decorative (`aria-hidden`) in both places — the real information
 * (the tier headline, the score, the interpretation sentence) is always a
 * real heading/paragraph nearby; this never substitutes for it. No
 * library: plain CSS keyframes (app/globals.css's `.sameeeish-word*`
 * rules), wrapped in `@media (prefers-reduced-motion: no-preference)` —
 * reduced-motion viewers see the final word immediately, fully formed,
 * same meaning, no per-letter motion.
 */

const FULL_WORD = "SAMEEEISH!";
const CELEBRATE_WORD = "SAMEEE!";
const ISH_START = FULL_WORD.indexOf("ISH");

const LETTER_STAGGER_MS = 65;
const LETTER_POP_MS = 420;
/** How long to hold after the last letter's own pop-in finishes before a
 * caller (ResultReveal) moves on — a pacing choice, not tied to motion
 * preference itself. */
const POST_ANIMATION_PAUSE_MS = 450;
/** A reduced-motion viewer isn't shown the per-letter build at all (the
 * word is just there, fully formed) — this is only a short, deliberate
 * beat before moving on, not a wait for an animation nobody sees play. */
const REDUCED_MOTION_PAUSE_MS = 500;

export function sameeeishWordFor(celebrate: boolean): string {
  return celebrate ? CELEBRATE_WORD : FULL_WORD;
}

/** How long components/result/result-reveal.tsx should hold the reveal
 * open for, in ms, given this exact word and motion preference. */
export function sameeeishRevealDurationMs(
  celebrate: boolean,
  prefersReducedMotion: boolean,
): number {
  if (prefersReducedMotion) return REDUCED_MOTION_PAUSE_MS;
  const length = sameeeishWordFor(celebrate).length;
  return (length - 1) * LETTER_STAGGER_MS + LETTER_POP_MS + POST_ANIMATION_PAUSE_MS;
}

export function SameeeishWordmark({
  celebrate = false,
  size = "inline",
  className,
}: {
  celebrate?: boolean;
  /** "hero" = the full-screen result-reveal transition; "inline" = the
   * smaller flourish sitting inside a result card. Same word/timing/
   * colors either way, only the font-size differs (app/globals.css). */
  size?: "hero" | "inline";
  className?: string;
}) {
  const word = sameeeishWordFor(celebrate);
  const letters = word.split("");

  return (
    <p
      className={`sameeeish-word sameeeish-word--${size}${celebrate ? " sameeeish-word--celebrate" : ""}${className ? ` ${className}` : ""}`}
      aria-hidden="true"
    >
      {letters.map((letter, i) => {
        const isIsh = !celebrate && i >= ISH_START && letter !== "!";
        return (
          <span
            key={i}
            className={`sameeeish-word__letter${isIsh ? " sameeeish-word__letter--ish" : ""}`}
            style={{ animationDelay: `${i * LETTER_STAGGER_MS}ms` }}
          >
            {letter}
          </span>
        );
      })}
    </p>
  );
}
