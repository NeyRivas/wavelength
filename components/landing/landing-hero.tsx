import Link from "next/link";

const AVATARS: { label: string; className: string }[] = [
  { label: "A", className: "landing-avatar--pink" },
  { label: "B", className: "landing-avatar--lavender" },
  { label: "C", className: "landing-avatar--blue" },
  { label: "D", className: "landing-avatar--mint" },
];

/**
 * Hero (Figma reference, screenshot 1): eyebrow, headline, description,
 * primary CTA + note, social proof row, and the abstract right-side
 * illustration.
 *
 * Visual-exploration pass (feedback: "make the Hero more dynamic and
 * visually dimensional"): the illustration keeps its original elements
 * (three colored arcs, a bullseye, scattered dots) but the two flat
 * off-canvas circles are now soft animated gradient blobs, the previously
 * opaque "orbit" circle is a translucent glass surface (backdrop-filter)
 * with a blob visible through it, and the dashed trajectory between the
 * two ringed dots is now an actual flowing wavelength — a gradient stroke
 * with a slow marching dash animation, plus a gentle, out-of-phase bob on
 * each dot. All motion is CSS-only (no JS, no new state), slow and
 * looping, and disabled entirely under prefers-reduced-motion (see
 * app/globals.css) — purely decorative, still `aria-hidden`, and never
 * competes with the headline/CTA for attention.
 */
export function LandingHero() {
  return (
    <section className="landing-hero">
      <div className="landing-hero__content">
        <p className="landing-eyebrow">
          <span className="landing-eyebrow__dot landing-eyebrow__dot--pink" aria-hidden="true" />
          <span className="landing-eyebrow__dot landing-eyebrow__dot--blue" aria-hidden="true" />A
          game for two
        </p>

        <h1 className="landing-hero__heading">Are we on the same wavelength?</h1>

        <p className="landing-hero__description">
          Create a set of questions, answer them yourself, then share the link. See where you align
          — and where you beautifully don&apos;t.
        </p>

        <div className="landing-hero__actions">
          <Link href="/create" className="landing-button landing-button--primary">
            Let&apos;s play <span aria-hidden="true">→</span>
          </Link>
          <span className="landing-hero__note">Free · No sign-up needed</span>
        </div>

        <div className="landing-social-proof">
          <div className="landing-avatars">
            {AVATARS.map((a) => (
              <span key={a.label} className={`landing-avatar ${a.className}`}>
                {a.label}
              </span>
            ))}
          </div>
          <span>12,400+ wavelengths shared</span>
        </div>
      </div>

      <div className="landing-hero__illustration" aria-hidden="true">
        <div className="hero-shape hero-shape--one" />
        <div className="hero-shape hero-shape--two" />
        <div className="hero-shape hero-shape--three" />

        {/* Restrained glass surface — a translucent, blurred-backdrop
            circle floating above the gradient blobs (hero-shape--three
            sits directly behind it, so its peach glow shows through),
            replacing the previous flat white "orbit" circle. A plain
            HTML div rather than an SVG element specifically so it can use
            backdrop-filter, which SVG shapes can't reliably use for
            content painted outside the SVG itself. Sized/positioned as
            percentages matching the SVG's own 400x400 viewBox circle
            (cx=200 cy=200 r=150 → 75% diameter, 12.5% inset) so it lines
            up with the artwork drawn on top of it in the SVG below. */}
        <div className="hero-glass" />

        <svg className="hero-shape__svg" viewBox="0 0 400 400" fill="none">
          {/* three colored arcs curving around the lower-left of the orbit */}
          <path
            d="M90 250a130 130 0 0 1 55-108"
            stroke="var(--wl-peach)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M100 285a150 150 0 0 1 45-158"
            stroke="var(--wl-pink)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M115 310a165 165 0 0 1 20-190"
            stroke="var(--wl-blue)"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* bullseye at the orbit's center */}
          <circle cx="200" cy="200" r="46" stroke="var(--wl-lavender)" strokeWidth="14" />
          <circle cx="200" cy="200" r="26" fill="#ffffff" />
          <circle cx="200" cy="200" r="13" fill="var(--wl-ink)" />

          {/* the wavelength itself: a gradient-stroked trajectory between
              the two ringed dots (each representing a participant), with
              a slow marching-dash flow (app/globals.css: hero-wave-flow)
              standing in for "energy traveling along the connection"
              instead of a static dashed line, plus a gentle, out-of-phase
              vertical bob on each dot (hero-wave-bob) — deliberately
              small/slow so it reads as alive, not distracting. */}
          <defs>
            <linearGradient id="heroWaveGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--wl-pink)" />
              <stop offset="100%" stopColor="var(--wl-blue)" />
            </linearGradient>
          </defs>
          <path
            className="hero-wave-path"
            d="M60 235c70-70 210-70 280 25"
            stroke="url(#heroWaveGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="2 11"
            fill="none"
          />
          <circle
            className="hero-wave-dot"
            cx="60"
            cy="235"
            r="13"
            fill="#ffffff"
            stroke="var(--wl-pink)"
            strokeWidth="4"
          />
          <circle className="hero-wave-dot" cx="60" cy="235" r="5" fill="var(--wl-ink)" />
          <circle
            className="hero-wave-dot hero-wave-dot--b"
            cx="340"
            cy="260"
            r="13"
            fill="#ffffff"
            stroke="var(--wl-blue)"
            strokeWidth="4"
          />
          <circle
            className="hero-wave-dot hero-wave-dot--b"
            cx="340"
            cy="260"
            r="5"
            fill="var(--wl-ink)"
          />

          {/* scattered small dots */}
          <circle cx="18" cy="278" r="5" fill="var(--wl-lavender)" />
          <circle cx="238" cy="132" r="5" fill="var(--wl-mint)" />
          <circle cx="368" cy="182" r="6" fill="var(--wl-peach)" />
          <circle cx="352" cy="322" r="5" fill="var(--wl-lavender)" />
          <circle cx="185" cy="368" r="5" fill="var(--wl-peach)" />
          <circle cx="80" cy="345" r="5" fill="var(--wl-pink)" />
        </svg>
      </div>
    </section>
  );
}
