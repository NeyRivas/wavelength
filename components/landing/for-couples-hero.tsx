import Link from "next/link";

const WAVE_START_X = 20;
const WAVE_WIDTH = 220;

/** Same plain-sine-polyline technique as components/landing/landing-hero.tsx
 * (buildWavePath), parametrized even smaller/quieter than the
 * how-it-works-hero.tsx echo — this stays a Server Component, no client
 * JS. */
function buildWavePath(
  baseline: number,
  amplitude: number,
  periods: number,
  phase: number,
  points = 44,
): string {
  const segments: string[] = [];
  for (let i = 0; i <= points; i++) {
    const x = WAVE_START_X + (i / points) * WAVE_WIDTH;
    const theta = (i / points) * periods * 2 * Math.PI + phase;
    const y = baseline + amplitude * Math.sin(theta);
    segments.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return segments.join(" ");
}

// Wave A / Wave B: same family as the homepage Hero and the
// how-it-works-hero.tsx echo, contained to an even smaller amplitude and
// drift range — this page's motif is meant to read as the quietest of
// the three, supporting the "two people, one shared thread" framing.
const WAVE_A_BASELINE = 30;
const WAVE_A_AMPLITUDE = 8;
const WAVE_A_PERIODS = 1.5;
const WAVE_A_PHASE = 0;

const WAVE_B_BASELINE = 30;
const WAVE_B_AMPLITUDE = 6;
const WAVE_B_PERIODS = 1.9;
const WAVE_B_PHASE = Math.PI / 2.5;

const wavePathA = buildWavePath(WAVE_A_BASELINE, WAVE_A_AMPLITUDE, WAVE_A_PERIODS, WAVE_A_PHASE);
const wavePathB = buildWavePath(WAVE_B_BASELINE, WAVE_B_AMPLITUDE, WAVE_B_PERIODS, WAVE_B_PHASE);

/**
 * Hero for /for-couples. Same visual language as the homepage hero
 * (components/landing/landing-hero.tsx) — eyebrow dots, Fraunces italic
 * heading, soft pastel blobs — but its own, centered composition: two
 * CTAs instead of one (a primary path into the product, and a secondary
 * path to /how-it-works for anyone who wants the mechanics first), and a
 * small three-node motif standing in for "two people, one shared thread"
 * rather than the homepage's larger side illustration. No stock
 * photography, no illustrated couple — the "for couples" framing lives
 * entirely in the copy and the motif, not in a picture of two people.
 *
 * The motif's connecting line now draws the same "Wave A + Wave B"
 * language as the Hero and how-it-works-hero.tsx (two independently-
 * drifting sine paths, same two gradients) instead of a single static
 * dashed line, at the most contained amplitude of the three — the three
 * dots, layout, copy, and everything else are unchanged.
 */
export function ForCouplesHero() {
  return (
    <section className="landing-section fc-hero">
      <div className="fc-hero__shapes" aria-hidden="true">
        <div className="fc-hero__shape fc-hero__shape--lavender" />
        <div className="fc-hero__shape fc-hero__shape--mint" />
      </div>

      <div className="fc-hero__content">
        <p className="landing-eyebrow landing-eyebrow--plain fc-hero__eyebrow">
          <span className="landing-eyebrow__dot landing-eyebrow__dot--pink" aria-hidden="true" />
          <span className="landing-eyebrow__dot landing-eyebrow__dot--blue" aria-hidden="true" />
          For couples
        </p>

        <h1 className="landing-section__heading fc-hero__heading">
          There&apos;s always more to discover about each other.
        </h1>

        <p className="landing-section__text fc-hero__text">
          You know their coffee order, their go-to story, how they take a joke. Wavelength is a
          quick, private way to find the things you haven&apos;t talked about yet — no quiz score
          and no verdict, just a shared starting point for a real conversation.
        </p>

        <div className="fc-hero__actions">
          <Link href="/create" className="landing-button landing-button--primary">
            Create your wavelength <span aria-hidden="true">→</span>
          </Link>
          <Link href="/how-it-works" className="landing-button landing-button--outline">
            See how it works
          </Link>
        </div>

        <svg className="fc-hero__motif" viewBox="0 0 260 60" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="fcHeroWaveGradientA" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--wl-lavender)" />
              <stop offset="100%" stopColor="var(--wl-pink)" />
            </linearGradient>
            <linearGradient id="fcHeroWaveGradientB" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--wl-blue)" />
              <stop offset="100%" stopColor="var(--wl-mint)" />
            </linearGradient>
          </defs>

          <g className="fc-hero-wave fc-hero-wave--a">
            <path
              d={wavePathA}
              stroke="url(#fcHeroWaveGradientA)"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.9"
            />
          </g>
          <g className="fc-hero-wave fc-hero-wave--b">
            <path
              d={wavePathB}
              stroke="url(#fcHeroWaveGradientB)"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.9"
            />
          </g>

          <circle cx="20" cy="30" r="9" fill="#ffffff" stroke="var(--wl-pink)" strokeWidth="4" />
          <circle cx="20" cy="30" r="3.5" fill="var(--wl-ink)" />
          <circle
            cx="130"
            cy="16"
            r="7"
            fill="#ffffff"
            stroke="var(--wl-lavender)"
            strokeWidth="4"
          />
          <circle cx="130" cy="16" r="2.5" fill="var(--wl-ink)" />
          <circle cx="240" cy="30" r="9" fill="#ffffff" stroke="var(--wl-blue)" strokeWidth="4" />
          <circle cx="240" cy="30" r="3.5" fill="var(--wl-ink)" />
        </svg>
      </div>
    </section>
  );
}
