import Link from "next/link";

import { HeroWaves } from "./hero-waves";

const AVATARS: { label: string; className: string }[] = [
  { label: "A", className: "landing-avatar--pink" },
  { label: "B", className: "landing-avatar--lavender" },
  { label: "C", className: "landing-avatar--blue" },
  { label: "D", className: "landing-avatar--mint" },
];

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
 * ReviewIntro/InviteIntro/the Result page's own wave already use), so
 * they visibly drift toward and away from phase over time — never
 * mechanically synced, never permanently apart. A soft central glow
 * pulses on its own slower cycle, standing in for a
 * recurring "moment of alignment" without literally scripting one. The
 * previous orbit/arcs/bullseye motif is retired in favor of this more
 * legible, more central two-wave visual (the arcs read as more generic
 * "target" iconography, competing with — rather than reinforcing — the
 * two-wavelength concept this pass is meant to make obvious).
 *
 * Background-removal pass: the section's old background (two large,
 * soft, animated .landing-hero__ambient-blob radial gradients) was
 * removed entirely, ahead of proposing a new background from a reference
 * image.
 *
 * New-background pass: a new `.landing-hero__ambient` wrapper replaces
 * it, built from the approved mockup — a soft diagonal pastel wash
 * (.landing-hero__ambient-wash) plus one gentle white glow
 * (.landing-hero__ambient-glow). Originally full-bleed (see git history);
 * the "showpiece" pass below changes how it's contained, not its own
 * gradient/opacity/blur recipe, which is still exactly the approved
 * mockup's.
 *
 * Showpiece pass: the whole hero is now wrapped in `.landing-hero__frame`
 * — a rounded-rectangle card, structurally the same idea as the page's
 * own closing `.landing-dark-cta` band (position: relative; overflow:
 * hidden; border-radius; its own internal padding), just carrying the
 * hero's own gradient instead of that section's solid ink fill. The
 * ambient wash/glow are now sized and positioned exactly as before but
 * live *inside* this frame instead of bleeding to the viewport's edges —
 * `overflow: hidden` on the frame clips them at its own rounded border,
 * which is also what makes the old bottom `mask-image` fade (used to
 * dissolve the gradient into "How it works" below) unnecessary: there's
 * no page-background-colored seam left to hide once the gradient simply
 * ends at the frame's own edge. `.landing-hero` itself (the section)
 * keeps the page's standard 60rem hero width and now holds only outer
 * spacing — the frame is what actually carries the background, border-
 * radius, and content padding.
 *
 * Floating-animation pass: each of those two layers now drifts on its
 * own independent CSS animation (slow translate + gentle scale,
 * ease-in-out, infinite, different durations — see
 * hero-ambient-wash-float/hero-ambient-glow-float in app/globals.css),
 * adapting only the MOTION CHARACTER of a supplied FloatingGradient
 * reference component (horizontal/vertical float, scale breathing,
 * ease-in-out, per-layer duration) — not its own colors, its React/
 * Framer Motion implementation (this project doesn't have Framer
 * Motion installed, and none was added for this), its card container,
 * or its magnitude/speed (the reference's 8-12s/100px moves are
 * explicitly "obvious moving circles"; these run 3-4x slower and move a
 * few rem at most, matching this file's existing wave-drift/blob-drift
 * conventions elsewhere). The wave illustration below is unaffected —
 * its own paths, dots, drift animation, and sync-glow are completely
 * unchanged.
 *
 * All motion here is CSS-only (no JS, no new state), continuous and
 * slow, and disabled entirely under prefers-reduced-motion (see
 * app/globals.css) — purely decorative, still `aria-hidden`, and never
 * competes with the headline/CTA for attention.
 *
 * Motion pass: same composition and artwork, better movement. The
 * illustration is now its own small Client Component
 * (components/landing/hero-waves.tsx — this file stays a Server
 * Component) that makes the waves ripple instead of sliding, lets the
 * dots ride them, ties the center glow to the waves' real alignment,
 * eases both waves into one rhythm while "Let's play" is hovered or
 * focused, and adds a few pixels of pointer parallax across the existing
 * layers. A one-time CSS entrance (app/globals.css, "hero entrance")
 * settles the supporting copy in around the (still) headline and draws
 * the waves on load. Under
 * prefers-reduced-motion none of this runs and the hero is the original
 * static artwork.
 */
export function LandingHero() {
  return (
    <section className="landing-hero">
      <div className="landing-hero__frame">
        <div className="landing-hero__ambient" aria-hidden="true">
          <div className="landing-hero__ambient-wash" />
          <div className="landing-hero__ambient-glow" />
        </div>

        <div className="landing-hero__inner">
          <div className="landing-hero__content">
            <p className="landing-eyebrow landing-hero__eyebrow">
              <span
                className="landing-eyebrow__dot landing-eyebrow__dot--pink"
                aria-hidden="true"
              />
              <span
                className="landing-eyebrow__dot landing-eyebrow__dot--blue"
                aria-hidden="true"
              />
              A game for two
            </p>

            <h1 className="landing-hero__heading">Are you really on the same page?</h1>

            <p className="landing-hero__description">Find out together.</p>

            <div className="landing-hero__actions">
              <Link
                href="/play"
                className="landing-button landing-button--primary landing-button--hero"
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
              <HeroWaves />
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
        </div>
      </div>
    </section>
  );
}
