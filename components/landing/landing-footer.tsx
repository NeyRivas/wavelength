import Link from "next/link";

import { LogoMark } from "./logo-mark";

/**
 * The compact white footer bar (Figma reference, screenshot 4, bottom
 * strip) — replaces the previous iteration's full-bleed giant wordmark
 * treatment entirely; the reference shows a normal small-scale footer
 * instead, and per this task's brief the screenshots override every
 * earlier landing design.
 *
 * "About" / "Privacy" / "Terms" / "Contact" appear in the reference but
 * have no corresponding page anywhere in this app — same reasoning as
 * the header's "For couples"/"FAQ": rendered as plain inert labels
 * rather than links to pages that don't exist.
 */
export function LandingFooter() {
  return (
    <footer className="landing-footer">
      <Link href="/" className="landing-logo landing-logo--footer">
        <LogoMark className="landing-logo__mark" />
        <span>Sameeeish</span>
      </Link>

      <nav className="landing-footer__links" aria-label="Legal">
        <span className="landing-nav__inert">About</span>
        <span className="landing-nav__inert">Privacy</span>
        <span className="landing-nav__inert">Terms</span>
        <span className="landing-nav__inert">Contact</span>
      </nav>

      <p className="landing-footer__copy">© 2026 Sameeeish. Made with care.</p>
    </footer>
  );
}
