/**
 * A's post-finalization intro (app/w/[token]/page.tsx, WAITING/IN_PROGRESS
 * states only). Purely emotional framing — "you're done, now invite
 * someone" — no result, no score, no mention of comparison. The small
 * motif reuses the exact vocabulary already established elsewhere
 * (landing/how-it-works/for-couples heroes): a dashed trajectory between
 * two ringed dots. Here it's given its own meaning without changing the
 * visual language — A's dot (left) is filled solid, already "placed";
 * B's (right) is a dashed, unfilled ring, waiting to land somewhere on
 * the same line. Abstract only — not a chart, not a score, not a
 * literal spectrum with any position/value.
 *
 * Polish pass: the connecting trajectory now uses the shared
 * .wl-connector treatment (gradient stroke + a slow marching-dash flow)
 * — the same lightweight echo of the Hero/Results wavelength language
 * used by InviteIntro, the "Finding your wavelength…" transition, and
 * the "Keep this wavelength?" dialog. The dots themselves and what they
 * mean are completely unchanged.
 */
export function ReviewIntro() {
  return (
    <div className="share-intro">
      <svg className="share-intro__motif" viewBox="0 0 260 56" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="reviewConnectorGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--wl-lavender)" />
            <stop offset="100%" stopColor="var(--wl-blue)" />
          </linearGradient>
        </defs>
        <path
          className="wl-connector"
          d="M18 36c40-28 80-28 112 0s72 28 112 0"
          stroke="url(#reviewConnectorGradient)"
          strokeWidth="1.5"
          strokeDasharray="5 6"
        />
        <circle cx="18" cy="36" r="9" fill="#ffffff" stroke="var(--wl-lavender)" strokeWidth="4" />
        <circle cx="18" cy="36" r="3.5" fill="var(--wl-ink)" />
        <circle
          cx="242"
          cy="36"
          r="9"
          fill="#ffffff"
          stroke="var(--wl-blue)"
          strokeWidth="2"
          strokeDasharray="3 3"
        />
      </svg>

      <h1 className="share-intro__heading">Your answers are in.</h1>
      <p className="share-intro__text">Now invite someone to answer the same questions.</p>
    </div>
  );
}
