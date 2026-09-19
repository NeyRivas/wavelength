import Link from "next/link";

/**
 * The "not a participant / link doesn't exist" state
 * (app/w/[token]/result/page.tsx) — shown when there's no wavelength row
 * for this token, or the caller isn't one of its two participants. Purely
 * a visual redesign of what used to be a single bare, unstyled
 * `<main><h1>/<p></main>` with no classes at all — the guard that decides
 * *when* this renders (and the authorization check behind it) lives
 * entirely in the page component and is completely untouched, as is the
 * copy.
 *
 * The motif is deliberately not the "two ringed dots" language used by
 * ReviewIntro/InviteIntro/B's "Nice try!" screen — those all represent a
 * real two-person connection; this screen means the opposite (no valid
 * wavelength for this viewer), so it's a single wave whose gradient
 * stroke fades to transparent at both ends instead of terminating in a
 * dot, still marching gently via the same shared `.wl-connector` flow
 * used everywhere else.
 */
export function ResultNotAvailableNotice() {
  return (
    <div className="result-unavailable">
      <div className="result-unavailable__ambient" aria-hidden="true">
        <div className="result-unavailable__ambient-blob result-unavailable__ambient-blob--a" />
        <div className="result-unavailable__ambient-blob result-unavailable__ambient-blob--b" />
      </div>

      <svg
        className="result-unavailable__motif"
        viewBox="0 0 260 56"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="resultUnavailableGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--wl-lavender)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--wl-blue)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--wl-mint)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          className="wl-connector"
          d="M18 36c40-28 80-28 112 0s72 28 112 0"
          stroke="url(#resultUnavailableGradient)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="5 6"
        />
      </svg>

      <h1 className="result-unavailable__heading">Result not available</h1>
      <p className="result-unavailable__text">
        This link either doesn&apos;t exist, or you&apos;re not one of its two participants.
      </p>

      <Link href="/create" className="result-unavailable__button">
        Create your own Wavelength
      </Link>
    </div>
  );
}
