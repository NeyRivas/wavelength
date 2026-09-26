import Link from "next/link";

/**
 * Simple secondary "← Back" text link — same subtle visual treatment as
 * the /create flow's own back link (components/questionnaire/create-header.tsx's
 * .create-header__back: small, muted, no background, darkens on hover).
 * That existing link lives inside CreateHeader's own compact product bar;
 * the pages that need this control (/ways-to-play, /play,
 * /play/dating-couples, /play/friends) all carry the full, shared
 * LandingHeader instead, which has no per-page back slot and must stay
 * identical across every marketing route — so this renders as its own
 * small row at the top of the page's own content, right under the
 * header, aligned to the same content column as the heading below it.
 * Deliberately just a text link, not a button or card, so it reads as
 * secondary navigation rather than another CTA.
 */
export function BackLink({ href }: { href: string }) {
  return (
    <div className="landing-back-link-row">
      <Link href={href} className="landing-back-link">
        ← Back
      </Link>
    </div>
  );
}
