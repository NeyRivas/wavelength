"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoMark } from "./logo-mark";

const NAV_LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/for-couples", label: "For couples" },
  { href: "/faq", label: "FAQ" },
] as const;

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
 *
 * "use client" + usePathname() only to compute which nav item is active —
 * everything else here is exactly as static as before. This is a route
 * comparison, not scroll/interaction state, so it's correct on first load,
 * on a direct navigation, and on a refresh alike (no client-only default
 * that could ever flash the wrong item active).
 */
export function LandingHeader() {
  const pathname = usePathname();

  return (
    <header className="landing-header">
      <div className="landing-header__inner">
        <Link href="/" className="landing-logo">
          <LogoMark className="landing-logo__mark" />
          <span>Sameeeish</span>
        </Link>

        <nav className="landing-nav" aria-label="Landing sections">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={pathname === link.href ? "landing-nav__link--active" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link href="/create" className="landing-header__cta">
          Start playing
        </Link>
      </div>
    </header>
  );
}
