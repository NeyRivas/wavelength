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
 * illustration. The illustration is a hand-reproduced approximation of
 * the reference composition (two flat off-canvas circles + a bordered
 * "orbit" circle containing a bullseye, three colored arcs, a dashed
 * trajectory between two ringed dots, and scattered small dots) — see the
 * final report for why an exact vector match isn't possible from a flat
 * screenshot.
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
        <div className="hero-shape hero-shape--lavender" />
        <div className="hero-shape hero-shape--mint" />

        <svg className="hero-shape__svg" viewBox="0 0 400 400" fill="none">
          {/* the bordered "orbit" circle, drawn in-SVG (not a separate
              CSS div) so it never drifts out of alignment with the
              bullseye/arcs/dots drawn on top of it */}
          <circle
            className="hero-orbit-circle"
            cx="200"
            cy="200"
            r="150"
            fill="#ffffff"
            stroke="var(--color-border)"
          />

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

          {/* dashed trajectory between the two ringed dots */}
          <path
            d="M60 235c70-70 210-70 280 25"
            stroke="var(--wl-muted)"
            strokeWidth="1.5"
            strokeDasharray="5 6"
            fill="none"
          />
          <circle cx="60" cy="235" r="13" fill="#ffffff" stroke="var(--wl-pink)" strokeWidth="4" />
          <circle cx="60" cy="235" r="5" fill="var(--wl-ink)" />
          <circle cx="340" cy="260" r="13" fill="#ffffff" stroke="var(--wl-blue)" strokeWidth="4" />
          <circle cx="340" cy="260" r="5" fill="var(--wl-ink)" />

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
