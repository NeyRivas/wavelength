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
 */
export function ReviewIntro() {
  return (
    <div className="share-intro">
      <svg className="share-intro__motif" viewBox="0 0 260 56" fill="none" aria-hidden="true">
        <path
          d="M18 36c40-28 80-28 112 0s72 28 112 0"
          stroke="var(--wl-muted)"
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
