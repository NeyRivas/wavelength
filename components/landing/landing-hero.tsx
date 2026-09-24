import Link from "next/link";

const AVATARS: { label: string; className: string }[] = [
  { label: "A", className: "landing-avatar--pink" },
  { label: "B", className: "landing-avatar--lavender" },
  { label: "C", className: "landing-avatar--blue" },
  { label: "D", className: "landing-avatar--mint" },
];

const WAVE_START_X = -60;
const WAVE_WIDTH = 520;

/** A plain sine polyline, computed once at render time (this stays a
 * Server Component — no client JS). Same technique as
 * components/result/wavelength-indicator.tsx's buildSinePath, just
 * parametrized for this illustration's own wider canvas (the path is
 * drawn well past both edges of the visible glass circle so the CSS
 * translateX drift below never reveals empty space). */
function buildWavePath(
  baseline: number,
  amplitude: number,
  periods: number,
  phase: number,
  points = 56,
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

function waveY(baseline: number, amplitude: number, periods: number, phase: number, x: number) {
  const theta = ((x - WAVE_START_X) / WAVE_WIDTH) * periods * 2 * Math.PI + phase;
  return baseline + amplitude * Math.sin(theta);
}

// Wave A ("Person A") and Wave B ("Person B") — deliberately different
// amplitude/frequency/phase so the two are visually distinct even under
// prefers-reduced-motion (with the CSS animation below stopped, these two
// static shapes alone still read as "two different rhythms"). Each then
// drifts at its own independent CSS animation speed (app/globals.css:
// hero-wave-drift-a/-b — different durations, no shared timing), so their
// relative phase continuously evolves: sometimes closer, sometimes
// farther apart, never mechanically synced or permanently apart.
const WAVE_A_BASELINE = 200;
const WAVE_A_AMPLITUDE = 26;
const WAVE_A_PERIODS = 2.6;
const WAVE_A_PHASE = 0;

const WAVE_B_BASELINE = 200;
const WAVE_B_AMPLITUDE = 20;
const WAVE_B_PERIODS = 3.1;
const WAVE_B_PHASE = Math.PI / 2.5;

const wavePathA = buildWavePath(WAVE_A_BASELINE, WAVE_A_AMPLITUDE, WAVE_A_PERIODS, WAVE_A_PHASE);
const wavePathB = buildWavePath(WAVE_B_BASELINE, WAVE_B_AMPLITUDE, WAVE_B_PERIODS, WAVE_B_PHASE);

const DOT_A_X = 130;
const DOT_A_Y = waveY(WAVE_A_BASELINE, WAVE_A_AMPLITUDE, WAVE_A_PERIODS, WAVE_A_PHASE, DOT_A_X);
const DOT_B_X = 300;
const DOT_B_Y = waveY(WAVE_B_BASELINE, WAVE_B_AMPLITUDE, WAVE_B_PERIODS, WAVE_B_PHASE, DOT_B_X);

/**
 * Hero (Figma reference, screenshot 1): eyebrow, headline, description,
 * primary CTA + note, the two-wave illustration, and the social proof
 * row — all one centered vertical composition (redesign pass) rather
 * than a left text column beside a right-side illustration. The content
 * wrapper (.landing-hero__content) and the visual wrapper
 * (.landing-hero__visual, illustration + social proof) are stacked and
 * centered on a single axis at every breakpoint; see app/globals.css for
 * the layout rules (.landing-hero is a centered flex column now, not a
 * two-column grid).
 *
 * Visual-signature pass ("two people → two wavelengths → different
 * rhythms → trying to align"): the illustration's focal content is now
 * two independently-animated wave paths (Wave A, Wave B), each carrying
 * its own "participant dot" (the same lavender/blue ringed-dot language
 * ReviewIntro/InviteIntro/the Result page's own wave already use),
 * floating freely over the soft gradient blobs (no framing circle — see
 * the removal note in app/globals.css near .hero-shape--three) so they
 * visibly drift toward and away from phase over time — never
 * mechanically synced, never permanently apart. A soft central glow
 * pulses on its own slower cycle, standing in for a
 * recurring "moment of alignment" without literally scripting one. The
 * previous orbit/arcs/bullseye motif is retired in favor of this more
 * legible, more central two-wave visual (the arcs read as more generic
 * "target" iconography, competing with — rather than reinforcing — the
 * two-wavelength concept this pass is meant to make obvious).
 *
 * The primary CTA additionally gets a restrained glass treatment
 * (.landing-button--glass, additive to the existing .landing-button--
 * primary class other pages still use unmodified) — for the surface to
 * read as glass rather than flat grey, the hero now also carries two
 * large, very soft ambient gradient blobs (.landing-hero__ambient-blob)
 * spanning the whole section (not just the illustration column), so the
 * CTA — sitting in the text column — has living gradient underneath it
 * too, not a flat white background.
 *
 * All motion is CSS-only (no JS, no new state), continuous and slow, and
 * disabled entirely under prefers-reduced-motion (see app/globals.css) —
 * purely decorative, still `aria-hidden`, and never competes with the
 * headline/CTA for attention.
 */
export function LandingHero() {
  return (
    <section className="landing-hero">
      <div className="landing-hero__ambient" aria-hidden="true">
        <div className="landing-hero__ambient-blob landing-hero__ambient-blob--a" />
        <div className="landing-hero__ambient-blob landing-hero__ambient-blob--b" />
      </div>

      <div className="landing-hero__content">
        <p className="landing-eyebrow landing-hero__eyebrow">
          <span className="landing-eyebrow__dot landing-eyebrow__dot--pink" aria-hidden="true" />
          <span className="landing-eyebrow__dot landing-eyebrow__dot--blue" aria-hidden="true" />A
          game for two
        </p>

        <h1 className="landing-hero__heading">Are you really on the same page?</h1>

        <p className="landing-hero__description">Find out together.</p>

        <div className="landing-hero__actions">
          <Link
            href="/create"
            className="landing-button landing-button--cta-solid landing-button--hero"
          >
            Let&apos;s play <span aria-hidden="true">→</span>
          </Link>
          <span className="landing-hero__note">Free · No sign-up needed</span>
        </div>
      </div>

      {/* Centered composition (redesign pass): the two-wave illustration and
          the social-proof row now sit together, in that reading order, as
          one visual unit below the CTA — instead of the illustration
          floating beside the text column with social-proof stacked above
          it. Nothing about either child changes: the illustration is still
          its own aria-hidden decorative block, and the social-proof row is
          still real, accessible content — only their position in the flow
          moved. */}
      <div className="landing-hero__visual">
        <div className="landing-hero__illustration" aria-hidden="true">
          <div className="hero-shape hero-shape--one" />
          <div className="hero-shape hero-shape--two" />
          <div className="hero-shape hero-shape--three" />

          <svg
            className="hero-shape__svg"
            viewBox="0 0 400 400"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
          >
            <defs>
              <linearGradient id="heroWaveGradientA" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--wl-lavender)" />
                <stop offset="100%" stopColor="var(--wl-pink)" />
              </linearGradient>
              <linearGradient id="heroWaveGradientB" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--wl-blue)" />
                <stop offset="100%" stopColor="var(--wl-mint)" />
              </linearGradient>
            </defs>

            {/* a handful of scattered dots, kept clear of the two waves as
                light peripheral texture — not competing with them. Framed
                in a loose diamond around the wave band (two upper, two
                lower, alternating left/right) now that the illustration's
                visible window is the shorter band around y=200 (see
                .landing-hero__illustration's aspect-ratio in
                app/globals.css) rather than the full 400×400 square. */}
            <circle cx="18" cy="150" r="5" fill="var(--wl-lavender)" />
            <circle cx="368" cy="182" r="6" fill="var(--wl-peach)" />
            <circle cx="352" cy="255" r="5" fill="var(--wl-lavender)" />
            <circle cx="80" cy="250" r="5" fill="var(--wl-pink)" />

            {/* the recurring "moment of alignment" — a soft glow pulsing on
                its own, slower, independent cycle at the illustration's
                center */}
            <circle className="hero-sync-glow" cx="200" cy="200" r="60" fill="var(--wl-mint)" />

            {/* Wave A — "Person A"'s own rhythm */}
            <g className="hero-wave hero-wave--a">
              <path
                d={wavePathA}
                stroke="url(#heroWaveGradientA)"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
                opacity="0.9"
              />
              <circle
                cx={DOT_A_X}
                cy={DOT_A_Y}
                r="11"
                fill="#ffffff"
                stroke="var(--wl-lavender)"
                strokeWidth="4"
              />
              <circle cx={DOT_A_X} cy={DOT_A_Y} r="4" fill="var(--wl-ink)" />
            </g>

            {/* Wave B — "Person B"'s own, slightly different rhythm */}
            <g className="hero-wave hero-wave--b">
              <path
                d={wavePathB}
                stroke="url(#heroWaveGradientB)"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
                opacity="0.9"
              />
              <circle
                cx={DOT_B_X}
                cy={DOT_B_Y}
                r="11"
                fill="#ffffff"
                stroke="var(--wl-blue)"
                strokeWidth="4"
              />
              <circle cx={DOT_B_X} cy={DOT_B_Y} r="4" fill="var(--wl-ink)" />
            </g>
          </svg>
        </div>

        <div className="landing-social-proof">
          <div className="landing-avatars">
            {AVATARS.map((a) => (
              <span key={a.label} className={`landing-avatar ${a.className}`}>
                {a.label}
              </span>
            ))}
          </div>
          <span>12,400+ conversations started</span>
        </div>
      </div>
    </section>
  );
}
