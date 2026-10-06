export type ResultReactionTier = "excellent" | "good" | "fair" | "poor";

/** Fixed, hand-placed positions (never `Math.random()` — this renders on
 * the server first, so anything non-deterministic would mismatch on
 * hydration). Reused across tiers; TIER_SPARKLE_COUNT below just slices
 * how many of them show, so a higher tier is strictly "more of the same
 * shapes," not a different layout. */
const SPARKLE_SLOTS: { top: string; left: string; size: number; delayMs: number }[] = [
  { top: "4%", left: "10%", size: 16, delayMs: 0 },
  { top: "12%", left: "86%", size: 12, delayMs: 180 },
  { top: "82%", left: "8%", size: 13, delayMs: 360 },
  { top: "88%", left: "90%", size: 17, delayMs: 90 },
  { top: "2%", left: "52%", size: 11, delayMs: 480 },
  { top: "46%", left: "2%", size: 10, delayMs: 270 },
  { top: "50%", left: "96%", size: 14, delayMs: 600 },
];

const TIER_SPARKLE_COUNT: Record<ResultReactionTier, number> = {
  excellent: 7,
  good: 5,
  fair: 4,
  poor: 3,
};

/** Approved palette only — which tone shows at which slot, cycling so a
 * lower tier isn't just "the same colors with fewer shapes" but still
 * never leaves the approved mint/pink/lavender/blue/peach set. */
const TIER_COLORS: Record<ResultReactionTier, string[]> = {
  excellent: [
    "var(--wl-mint)",
    "var(--wl-pink)",
    "var(--wl-lavender)",
    "var(--wl-blue)",
    "var(--wl-peach)",
  ],
  good: ["var(--wl-lavender)", "var(--wl-mint)", "var(--wl-peach)"],
  fair: ["var(--wl-peach)", "var(--wl-blue)"],
  poor: ["var(--wl-blue)", "var(--wl-muted)"],
};

function SparkleShape({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 0c0 4.5 1 7.5 3 9.5S19.5 12 24 12c-4.5 0-7.5 1-9.5 3S12 19.5 12 24c0-4.5-1-7.5-3-9.5S0 12 0 12c4.5 0 7.5-1 9.5-3S12 4.5 12 0z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Small, tier-scaled decorative reaction — sparkles scattered around a
 * result headline (components/result/guess-accuracy-summary.tsx,
 * friendship-memory-summary.tsx; GlobalSummary.tsx reuses it too, scaled
 * by AlignmentLevel). Global QA/copy pass item #11: results read flat
 * without it. Intensity (shape count + palette richness) scales with the
 * tier — "excellent" gets the full approved-palette set, "poor" still
 * gets a couple of warm, cheeky sparkles, never none and never a sad/
 * negative visual, matching the approved "never cruel" rule.
 *
 * Purely decorative (`aria-hidden`) and purely additive to the existing
 * `.global-summary__glass` panel — absolutely positioned within it
 * (which already has `position: relative`), so it adds no layout height
 * and never pushes or reflows the real heading/score/interpretation
 * text. No library: inline SVG + CSS only. Each shape's "pop in, then
 * drift" animation is wrapped in `@media (prefers-reduced-motion:
 * no-preference)` (app/globals.css) — reduced-motion users simply see the
 * shapes sitting in place, fully visible, never animated.
 */
export function ResultSparkles({ tier }: { tier: ResultReactionTier }) {
  const count = TIER_SPARKLE_COUNT[tier];
  const colors = TIER_COLORS[tier];
  const slots = SPARKLE_SLOTS.slice(0, count);

  return (
    <div className={`result-sparkles result-sparkles--${tier}`} aria-hidden="true">
      {slots.map((slot, i) => (
        <span
          key={i}
          className="result-sparkles__item"
          style={{
            top: slot.top,
            left: slot.left,
            color: colors[i % colors.length],
            animationDelay: `${slot.delayMs}ms, ${slot.delayMs}ms`,
          }}
        >
          <SparkleShape size={slot.size} />
        </span>
      ))}
    </div>
  );
}
