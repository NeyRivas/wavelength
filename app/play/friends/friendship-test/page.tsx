import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";

import { BackLink } from "@/components/landing/back-link";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { FriendshipTestContent } from "@/components/play/friendship-test-content";

/**
 * /play/friends/friendship-test — the integrated experience page for the
 * "Friendship Check" ready-made game: editorial content and direct access
 * to the existing questionnaire on one URL. Its Friends catalog card links
 * here (its only button); the page's Start buttons submit the unchanged
 * startReadyMadeGame action with the game's id.
 *
 * Keyword map (Oct 2026 research): primary "friendship test", with
 * "friendship quiz" variants. Kept on shared memories ("us") so it doesn't
 * compete with /play/friends/how-well-do-you-know-me ("me").
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["400", "500", "600"],
  variable: "--font-fraunces",
  display: "swap",
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

const PAGE_PATH = "/play/friends/friendship-test";
const PAGE_TITLE = "Friendship Test: How Well Do You Remember Us? — Sameeeish";
const PAGE_DESCRIPTION =
  "A friendship test about your shared memories: where you met, inside jokes, the stories you still tell. Write the answers, send the link, see what they remember.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: PAGE_PATH,
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: PAGE_PATH,
    siteName: "Sameeeish",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

export default function FriendshipTestPage() {
  return (
    <div className={`${fraunces.variable} ${nunitoSans.variable} landing landing--internal`}>
      <LandingHeader />
      <main>
        <BackLink href="/play/friends" />
        <FriendshipTestContent />
      </main>
      <LandingFooter />
    </div>
  );
}
