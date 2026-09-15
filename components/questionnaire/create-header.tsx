import Link from "next/link";

import { LogoMark } from "@/components/landing/logo-mark";

/**
 * Local, product-only header for the /create flow (Figma reference: a
 * thin bar with the wordmark on the left and a plain "← Back" link on the
 * right) — deliberately NOT LandingHeader. The marketing pages' nav
 * (Home / How it works / For couples / FAQ / Start playing) doesn't
 * belong on the actual product screen, and per the brief the global
 * marketing header must stay untouched, so this is its own small
 * component instead of a variant bolted onto LandingHeader. It reuses
 * LogoMark (the same ring-and-dot icon) so the wordmark still reads as
 * the same brand, just without the marketing nav around it.
 */
export function CreateHeader() {
  return (
    <header className="create-header">
      <Link href="/" className="create-header__logo">
        <LogoMark className="create-header__logo-mark" />
        <span>Wavelength</span>
      </Link>
      <Link href="/" className="create-header__back">
        ← Back
      </Link>
    </header>
  );
}
