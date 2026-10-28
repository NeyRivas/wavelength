export type OverprintTone = "lavender" | "blue" | "pink" | "peach" | "mint";

/**
 * How the two discs sit for each game, chosen to say something about it:
 * - "overlap": side by side, partly shared (compare answers)
 * - "touch": just meeting (getting to know each other)
 * - "nested": a small disc inside a big one (going deeper)
 * - "horizon": one setting behind the other (date night)
 * - "guess": a solid disc and a dashed outline of it (guess the answer)
 * - "echo": two discs on a diagonal (remembering the same moment)
 * Every arrangement draws closer on hover/focus of the surrounding link
 * (see .op-glyph in app/overprint.css). Pure CSS, decorative only.
 */
export type OverprintArrangement = "overlap" | "touch" | "nested" | "horizon" | "guess" | "echo";

export function OverprintGlyph({
  arrangement,
  tones,
  className,
}: {
  arrangement: OverprintArrangement;
  tones: [OverprintTone, OverprintTone];
  className?: string;
}) {
  return (
    <span
      className={`op-glyph op-glyph--${arrangement}${className ? ` ${className}` : ""}`}
      aria-hidden="true"
    >
      <span className={`op-glyph__disc op-glyph__disc--a op-tone--${tones[0]}`} />
      <span className={`op-glyph__disc op-glyph__disc--b op-tone--${tones[1]}`} />
    </span>
  );
}
