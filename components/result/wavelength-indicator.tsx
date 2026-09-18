import type { AlignmentLevel } from "@/lib/scoring/score";

/** Approved-palette tones only (mint/peach/blue) — no red, no traffic-light
 * severity ordering, since a lower score is information, not a worse
 * grade. Presentation only; which level maps to which color has no effect
 * on `score`/`level` themselves. */
const COLOR_BY_LEVEL: Record<AlignmentLevel, string> = {
  "High Alignment": "var(--wl-mint)",
  "Mixed Alignment": "var(--wl-peach)",
  "Low Alignment": "var(--wl-blue)",
};

function buildSinePath(phaseOffset: number, width = 200, height = 60, points = 60): string {
  const amplitude = height / 2 - 4;
  const midY = height / 2;
  const frequency = 2; // full waves across the width
  const segments: string[] = [];
  for (let i = 0; i <= points; i++) {
    const x = (i / points) * width;
    const theta = (i / points) * frequency * 2 * Math.PI + phaseOffset;
    const y = midY + amplitude * Math.sin(theta);
    segments.push(`${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return segments.join(" ");
}

/**
 * A purely decorative, deterministic function of the score — not a chart,
 * not new data. Two waves start perfectly in phase at 100% and drift out
 * of phase as the score drops, visualizing "how much on the same
 * wavelength" without adding any numeric information beyond what
 * `score`/`level` already carry.
 */
export function WavelengthIndicator({ score, level }: { score: number; level: AlignmentLevel }) {
  const phaseOffset = ((100 - score) / 100) * Math.PI;

  return (
    <svg
      className="wavelength-indicator"
      viewBox="0 0 200 60"
      width="100%"
      height="60"
      role="img"
      aria-label={`Two waves shown ${score} percent in phase, representing your alignment`}
    >
      <path
        d={buildSinePath(0)}
        stroke="var(--wl-lavender)"
        strokeWidth="3.5"
        fill="none"
        opacity="0.9"
      />
      <path
        d={buildSinePath(phaseOffset)}
        stroke={COLOR_BY_LEVEL[level]}
        strokeWidth="3.5"
        fill="none"
        opacity="0.9"
      />
    </svg>
  );
}
