import Link from "next/link";

import { LogoMark } from "@/components/landing/logo-mark";

/**
 * Local, product-only header for the /create flow (Figma reference: a
 * thin bar with the wordmark on the left and a plain "← Back" link on the
 * right) — deliberately NOT LandingHeader. The marketing pages' nav
 * (Home / How it works / Ways to play / FAQ / Start playing) doesn't
 * belong on the actual product screen, and per the brief the global
 * marketing header must stay untouched, so this is its own small
 * component instead of a variant bolted onto LandingHeader. It reuses
 * LogoMark (the same ring-and-dot icon) so the wordmark still reads as
 * the same brand, just without the marketing nav around it.
 *
 * `backHref` defaults to /play (Make Your Own, or no ready-made-game
 * context) — app/create/page.tsx passes "/play/dating-couples" instead
 * whenever the current draft was just seeded from one of that group's
 * ready-made games, so Back returns to the screen the user actually came
 * from rather than always landing on the generic mode-selection screen.
 * Always an explicit href (never router.back()), so it's deterministic
 * regardless of prior browser history.
 */
export function CreateHeader({ backHref = "/play" }: { backHref?: string }) {
  return (
    <header className="create-header">
      <Link href="/" className="create-header__logo">
        <LogoMark className="create-header__logo-mark" />
        <span>Sameeeish</span>
      </Link>
      <Link href={backHref} className="create-header__back">
        ← Back
      </Link>
    </header>
  );
}
