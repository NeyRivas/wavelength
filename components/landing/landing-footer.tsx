import Link from "next/link";

import { LogoMark } from "./logo-mark";

const EXPLORE_LINKS = [
  { href: "/ways-to-play", label: "Ways to play" },
  { href: "/play", label: "Let's play" },
  { href: "/how-it-works", label: "How it works" },
] as const;

const INFO_LINKS = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
] as const;

/**
 * The site footer (Figma reference, screenshot 4, bottom strip), reworked
 * from a bare wordmark + four non-clickable "About"/"Privacy"/"Terms"/
 * "Contact" labels into a real, three-column footer: the Sameeeish
 * wordmark + a short description, an "Explore" group pointing at the
 * app's existing entry points, and an "Information" group pointing at
 * real pages (see app/about, app/privacy, app/terms, app/contact).
 */
export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="landing-footer">
      <div className="landing-footer__top">
        <div className="landing-footer__brand">
          <Link href="/" className="landing-logo landing-logo--footer">
            <LogoMark className="landing-logo__mark" />
            <span>Sameeeish</span>
          </Link>
          <p className="landing-footer__description">
            A playful way to see how aligned you are with someone, through questions and shared
            answers.
          </p>
        </div>

        <nav className="landing-footer__col" aria-label="Explore">
          <p className="landing-footer__heading">Explore</p>
          {EXPLORE_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="landing-footer__link">
              {link.label}
            </Link>
          ))}
        </nav>

        <nav className="landing-footer__col" aria-label="Information">
          <p className="landing-footer__heading">Information</p>
          {INFO_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="landing-footer__link">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <p className="landing-footer__copy">© {year} Sameeeish. Made with care.</p>
    </footer>
  );
}
