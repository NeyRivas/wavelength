import Link from "next/link";

import { LogoMark } from "./logo-mark";

/**
 * Sticky top nav (Figma reference, screenshot 1 — repeats identically at
 * the top of every section screenshot, i.e. it's a persistent header, not
 * a one-off hero element).
 *
 * "How it works" links to the dedicated /how-it-works route (bug fix —
 * it used to be an in-page anchor to the 3-card section further down "/"
 * itself; now that /how-it-works exists as its own page, this always
 * navigates there instead). "For couples" and "FAQ" link to their own
 * dedicated /for-couples and /faq routes the same way.
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
          <Link href="/how-it-works">How it works</Link>
          <Link href="/for-couples">For couples</Link>
          <Link href="/faq">FAQ</Link>
        </nav>

        <Link href="/create" className="landing-header__cta">
          Start playing
        </Link>
      </div>
    </header>
  );
}
