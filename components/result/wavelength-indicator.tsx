import type { AlignmentLevel } from "@/lib/scoring/score";

const COLOR_BY_LEVEL: Record<AlignmentLevel, string> = {
  "High Alignment": "#2f9e44",
  "Mixed Alignment": "#b8860b",
  "Low Alignment": "#5c6773",
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
      viewBox="0 0 200 60"
      width="100%"
      height="60"
      role="img"
      aria-label={`Two waves shown ${score} percent in phase, representing your alignment`}
    >
      <path d={buildSinePath(0)} stroke="#4361ee" strokeWidth="3" fill="none" opacity="0.85" />
      <path
        d={buildSinePath(phaseOffset)}
        stroke={COLOR_BY_LEVEL[level]}
        strokeWidth="3"
        fill="none"
        opacity="0.85"
      />
    </svg>
  );
}
