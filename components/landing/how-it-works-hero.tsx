// The two dots sit at x=24 and x=296 (see the <circle> elements below) —
// the wave path now spans exactly that range, so both ends land ON the
// dots instead of stopping short of them.
const WAVE_START_X = 24;
const WAVE_WIDTH = 272;

/** Same family as components/landing/landing-hero.tsx's buildWavePath,
 * with one addition: an amplitude envelope (sin(π·t), 0 at both ends,
 * peaking at the midpoint) so the curve always eases back to the
 * baseline exactly at each end, regardless of amplitude/periods/phase —
 * needed here because, unlike the homepage Hero (where the dots sit well
 * inside a much longer wave), this composition's two dots ARE the wave's
 * literal start and end anchors. This stays a Server Component, no
 * client JS. */
function buildWavePath(
  baseline: number,
  amplitude: number,
  periods: number,
  phase: number,
  points = 48,
): string {
  const segments: string[] = [];
  for (let i = 0; i <= points; i++) {
    const t = i / points;
    const x = WAVE_START_X + t * WAVE_WIDTH;
    const envelope = Math.sin(Math.PI * t);
    const theta = t * periods * 2 * Math.PI + phase;
    const y = baseline + amplitude * envelope * Math.sin(theta);
    segments.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return segments.join(" ");
}

// Wave A / Wave B: same family as the homepage Hero (independent
// amplitude/frequency/phase, independent CSS drift durations below) but
// smaller amplitude and a narrower drift range — a quieter echo that
// supports this page's "create, share, answer" copy rather than
// competing with it.
const WAVE_A_BASELINE = 30;
const WAVE_A_AMPLITUDE = 10;
const WAVE_A_PERIODS = 1.6;
const WAVE_A_PHASE = 0;

const WAVE_B_BASELINE = 30;
const WAVE_B_AMPLITUDE = 7;
const WAVE_B_PERIODS = 2.1;
const WAVE_B_PHASE = Math.PI / 2.5;

const wavePathA = buildWavePath(WAVE_A_BASELINE, WAVE_A_AMPLITUDE, WAVE_A_PERIODS, WAVE_A_PHASE);
const wavePathB = buildWavePath(WAVE_B_BASELINE, WAVE_B_AMPLITUDE, WAVE_B_PERIODS, WAVE_B_PHASE);

/**
 * Intro hero for /how-it-works. Deliberately not a copy of the homepage
 * hero (components/landing/landing-hero.tsx) — same visual language
 * (eyebrow dots, Fraunces italic heading, Nunito Sans body) but its own,
 * simpler composition (centered, no side illustration) so this page reads
 * as a continuation of the brand rather than a re-run of "/".
 *
 * `id="how-it-works"` gives the header's "How it works" nav link
 * (components/landing/landing-header.tsx, unmodified) something to
 * scroll to on this page too — on "/" it points at the 3-card section's
 * own id of the same name; here it resolves to the top of this page's
 * own how-it-works content. No change to the shared header was needed.
 *
 * The connecting motif between the two dots draws the same "Wave A +
 * Wave B" language as the Hero (two independently-drifting sine paths,
 * same two gradients — lavender→pink, blue→mint) instead of a single
 * static currentColor line, so this page reads as part of the same
 * product story: two people, moving through the process together. Both
 * waves span exactly from one dot to the other (see buildWavePath's
 * envelope above), and the CSS drift (app/globals.css) is kept small
 * enough that the join with each dot stays visually continuous through
 * the whole animation, not just at rest. Composition/copy/dots are
 * otherwise unchanged.
 */
export function HowItWorksHero() {
  return (
    <section id="how-it-works" className="landing-section hiw-hero">
      <p className="landing-eyebrow hiw-hero__eyebrow">
        <span className="landing-eyebrow__dot landing-eyebrow__dot--pink" aria-hidden="true" />
        <span className="landing-eyebrow__dot landing-eyebrow__dot--blue" aria-hidden="true" />
        The process
      </p>

      <h1 className="landing-section__heading hiw-hero__heading">How it works</h1>

      <p className="landing-section__text hiw-hero__text">
        One of you creates a set of questions and answers them first. Share the link, they answer
        the same questions on their own, and Wavelength shows you where you line up — and where you
        don&apos;t.
      </p>

      <svg className="hiw-hero__wave" viewBox="0 0 320 60" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="hiwHeroWaveGradientA" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--wl-lavender)" />
            <stop offset="100%" stopColor="var(--wl-pink)" />
          </linearGradient>
          <linearGradient id="hiwHeroWaveGradientB" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--wl-blue)" />
            <stop offset="100%" stopColor="var(--wl-mint)" />
          </linearGradient>
        </defs>

        <circle cx="24" cy="30" r="9" fill="#ffffff" stroke="var(--wl-pink)" strokeWidth="4" />
        <circle cx="24" cy="30" r="3.5" fill="var(--wl-ink)" />

        <g className="hiw-hero-wave hiw-hero-wave--a">
          <path
            d={wavePathA}
            stroke="url(#hiwHeroWaveGradientA)"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.9"
          />
        </g>
        <g className="hiw-hero-wave hiw-hero-wave--b">
          <path
            d={wavePathB}
            stroke="url(#hiwHeroWaveGradientB)"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.9"
          />
        </g>

        <circle cx="296" cy="30" r="9" fill="#ffffff" stroke="var(--wl-blue)" strokeWidth="4" />
        <circle cx="296" cy="30" r="3.5" fill="var(--wl-ink)" />
      </svg>
    </section>
  );
}
