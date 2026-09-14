const BADGES: { label: string; dotClass: string }[] = [
  { label: "No sign-up required", dotClass: "hiw-badge__dot--lavender" },
  { label: "Answers stay private", dotClass: "hiw-badge__dot--blue" },
  { label: "Works on any device", dotClass: "hiw-badge__dot--pink" },
  { label: "Done in minutes", dotClass: "hiw-badge__dot--mint" },
];

/** Quiet reassurance strip between the step story and the closing CTA —
 * same colored-dot-plus-label language as the eyebrow labels elsewhere on
 * the landing pages, not a new badge/pill style. */
export function HowItWorksBadges() {
  return (
    <div className="hiw-badges">
      {BADGES.map((badge) => (
        <span className="hiw-badge" key={badge.label}>
          <span className={`hiw-badge__dot ${badge.dotClass}`} aria-hidden="true" />
          {badge.label}
        </span>
      ))}
    </div>
  );
}
