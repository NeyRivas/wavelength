/**
 * B's entry screen (app/w/[token]/page.tsx, not-yet-a-participant branch).
 * Purely emotional/contextual framing — no scores, no comparison, no
 * questions revealed. Reuses the exact motif vocabulary established by
 * ReviewIntro (a dashed trajectory between two ringed dots): A's dot
 * (left) stays filled solid, already "placed", matching how it reads on
 * A's own Review & Share screen. B's dot (right) is no longer the
 * dashed/waiting ring from that screen — here it's B's own turn, so it's
 * drawn as an open, equally-weighted ring with a small sparkle beside it
 * to read as "about to begin" rather than passive waiting. Abstract only
 * — no percentage, no scale, no implied result before either side has
 * answered.
 */
export function InviteIntro({ aAlias }: { aAlias: string | null }) {
  return (
    <div className="invite-intro">
      <p className="invite-intro__eyebrow">You&apos;ve been invited</p>

      <h1 className="invite-intro__heading">Ready to find your wavelength?</h1>

      <svg className="invite-intro__motif" viewBox="0 0 260 56" fill="none" aria-hidden="true">
        <path
          d="M18 36c40-28 80-28 112 0s72 28 112 0"
          stroke="var(--wl-muted)"
          strokeWidth="1.5"
          strokeDasharray="5 6"
        />
        <circle cx="18" cy="36" r="9" fill="#ffffff" stroke="var(--wl-lavender)" strokeWidth="4" />
        <circle cx="18" cy="36" r="3.5" fill="var(--wl-ink)" />
        <circle cx="242" cy="36" r="10" fill="#ffffff" stroke="var(--wl-blue)" strokeWidth="4" />
        <path d="M254 19.5l1.7 4 4 1.7-4 1.7-1.7 4-1.7-4-4-1.7 4-1.7z" fill="var(--wl-blue)" />
      </svg>

      <p className="invite-intro__text">
        {aAlias ?? "Someone"} invited you to answer the same questions and see where your answers
        meet.
      </p>
    </div>
  );
}
