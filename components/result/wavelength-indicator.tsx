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

const WIDTH = 220;
const HEIGHT = 90;
const MARGIN = 26;
const DRAWN_WIDTH = WIDTH + MARGIN * 2;
const AMPLITUDE = HEIGHT / 2 - 8;
const MID_Y = HEIGHT / 2;
const FREQUENCY = 2; // full waves across the visible width

function buildSinePath(phaseOffset: number, points = 64): string {
  const segments: string[] = [];
  for (let i = 0; i <= points; i++) {
    const x = -MARGIN + (i / points) * DRAWN_WIDTH;
    const theta = ((x + MARGIN) / WIDTH) * FREQUENCY * 2 * Math.PI + phaseOffset;
    const y = MID_Y + AMPLITUDE * Math.sin(theta);
    segments.push(`${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return segments.join(" ");
}

/** Must use the exact same x→theta mapping as buildSinePath above (the
 * `+ MARGIN` matters) or a dot would sit visibly off its own wave's
 * curve. */
function sineY(x: number, phaseOffset: number): number {
  const theta = ((x + MARGIN) / WIDTH) * FREQUENCY * 2 * Math.PI + phaseOffset;
  return MID_Y + AMPLITUDE * Math.sin(theta);
}

const DOT_A_X = 50;
const DOT_B_X = 165;
const WAVE_A_DURATION_S = 4.5;

/**
 * Two wavelengths — A and B — the same visual signature the Hero
 * introduces ("two people, two rhythms, trying to align"), now driven by
 * the real, already-computed result instead of looping on its own.
 * Everything numeric here is still exactly what it was before this pass:
 * `phaseOffset` is the same `((100 - score) / 100) * Math.PI` formula,
 * unchanged, and `score`/`level` are still the exact same props straight
 * from `view.global` — this is a purely visual upgrade (gradients,
 * participant dots, continuous motion), never a new metric.
 *
 * The one new derived value, `waveBDuration`, is a rendering choice in
 * the same spirit as `phaseOffset` itself: at score 100 it exactly
 * matches Wave A's own duration (both drift in lockstep — "share a
 * rhythm"), and it slows down as score drops (up to 3s slower at score
 * 0), so Wave B visibly keeps its own, increasingly different rhythm the
 * lower the alignment — "intentan acercarse pero no logran sincronizarse"
 * for Low, "sincronizan parcialmente" for Mixed, "casi sincronizadas" for
 * High. Both waves also differ in shape (see the two `buildSinePath`
 * calls' amplitude via `phaseOffset` alone) — even with the animation
 * stopped entirely (prefers-reduced-motion), the two remain visually
 * distinguishable by both color and phase.
 */
export function WavelengthIndicator({ score, level }: { score: number; level: AlignmentLevel }) {
  const phaseOffset = ((100 - score) / 100) * Math.PI;
  const waveBDuration = WAVE_A_DURATION_S + ((100 - score) / 100) * 3;
  const glowOpacity = 0.15 + (score / 100) * 0.35;

  return (
    <svg
      className="wavelength-indicator"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width="100%"
      height={HEIGHT}
      role="img"
      aria-label={`Two wavelengths shown ${score} percent in phase, representing your alignment`}
    >
      <defs>
        <linearGradient id="wavelengthGradientA" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--wl-lavender)" />
          <stop offset="100%" stopColor="var(--wl-pink)" />
        </linearGradient>
      </defs>

      <circle
        className="wavelength-indicator__glow"
        cx={WIDTH / 2}
        cy={MID_Y}
        r={AMPLITUDE + 8}
        fill={COLOR_BY_LEVEL[level]}
        opacity={glowOpacity}
      />

      <g className="wavelength-wave wavelength-wave--a">
        <path
          d={buildSinePath(0)}
          stroke="url(#wavelengthGradientA)"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />
        <circle
          cx={DOT_A_X}
          cy={sineY(DOT_A_X, 0)}
          r="6"
          fill="#ffffff"
          stroke="var(--wl-lavender)"
          strokeWidth="3"
        />
      </g>

      <g
        className="wavelength-wave wavelength-wave--b"
        style={{ animationDuration: `${waveBDuration}s` }}
      >
        <path
          d={buildSinePath(phaseOffset)}
          stroke={COLOR_BY_LEVEL[level]}
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />
        <circle
          cx={DOT_B_X}
          cy={sineY(DOT_B_X, phaseOffset)}
          r="6"
          fill="#ffffff"
          stroke={COLOR_BY_LEVEL[level]}
          strokeWidth="3"
        />
      </g>
    </svg>
  );
}
