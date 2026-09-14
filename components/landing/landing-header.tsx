import Link from "next/link";

import { LogoMark } from "./logo-mark";

/**
 * Sticky top nav (Figma reference, screenshot 1 — repeats identically at
 * the top of every section screenshot, i.e. it's a persistent header, not
 * a one-off hero element).
 *
 * "How it works" is a real in-page anchor to the section below (#how-it-
 * works) — both live on this same route, so this is normal same-page
 * navigation, not an invented destination. "For couples" and "FAQ" are
 * shown in the reference but have no corresponding section anywhere in
 * the supplied screenshots or in the rest of the app; per the brief's own
 * "do not invent navigation/content" rule, these are rendered as plain
 * (non-interactive) labels — same visual position/styling as the
 * reference — rather than dead links to a page that doesn't exist.
 * "Start playing" is the same single real CTA the whole app has: /create.
 */
export function LandingHeader() {
  return (
    <header className="landing-header">
      <div className="landing-header__inner">
        <Link href="/" className="landing-logo">
          <LogoMark className="landing-logo__mark" />
          <span>Wavelength</span>
        </Link>

        <nav className="landing-nav" aria-label="Landing sections">
          <a href="#how-it-works">How it works</a>
          <span className="landing-nav__inert">For couples</span>
          <span className="landing-nav__inert">FAQ</span>
        </nav>

        <Link href="/create" className="landing-header__cta">
          Start playing
        </Link>
      </div>
    </header>
  );
}
