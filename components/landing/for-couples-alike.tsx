/**
 * Dark contrast section, mid-page. Same dark-panel language as the
 * closing CTA (components/landing/landing-cta-section.tsx) but a
 * standalone beat rather than a call to action — no button here, just the
 * page's central reframe: knowing someone well and knowing how they think
 * are two different things. Decorative motif reuses the bullseye /
 * overlapping-circles vocabulary already established on /how-it-works
 * (components/landing/how-it-works-steps.tsx) rather than inventing new
 * shapes, drawn fresh for this section's own composition.
 */
export function ForCouplesAlike() {
  return (
    <section className="fc-alike">
      <div className="fc-alike__shapes" aria-hidden="true">
        <svg viewBox="0 0 200 200" fill="none" className="fc-alike__rings">
          <circle
            cx="100"
            cy="100"
            r="90"
            stroke="var(--wl-lavender)"
            strokeWidth="1.5"
            opacity="0.35"
          />
          <circle
            cx="100"
            cy="100"
            r="64"
            stroke="var(--wl-lavender)"
            strokeWidth="1.5"
            opacity="0.5"
          />
          <circle
            cx="100"
            cy="100"
            r="38"
            stroke="var(--wl-lavender)"
            strokeWidth="1.5"
            opacity="0.65"
          />
        </svg>
        <svg viewBox="0 0 140 90" fill="none" className="fc-alike__overlap">
          <circle cx="52" cy="45" r="38" fill="var(--wl-mint)" opacity="0.4" />
          <circle cx="90" cy="45" r="38" fill="var(--wl-blue)" opacity="0.35" />
        </svg>
      </div>

      <div className="fc-alike__content">
        <h2 className="fc-alike__heading">You know each other. But do you think alike?</h2>
        <p className="fc-alike__text">
          Knowing someone and knowing how they see the world aren&apos;t always the same thing. This
          isn&apos;t about measuring how well you know each other, and it doesn&apos;t score your
          relationship — it just gives you both the same questions, answered apart, so you can see
          your two perspectives side by side.
        </p>
      </div>
    </section>
  );
}
