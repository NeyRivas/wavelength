/**
 * "Three things every couple takes away" — a three-row list, each row its
 * own pastel tint, deliberately distinct from the 3-card grid used both
 * on the homepage (components/landing/landing-how-it-works.tsx) and again
 * later on this page (components/landing/for-couples-summary.tsx), so the
 * two "align / differ / talk about" moments in this page don't read as
 * the same section repeated.
 */

function AlignIcon() {
  return (
    <svg className="fc-takeaway__svg" viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <circle cx="40" cy="50" r="28" fill="var(--wl-mint)" opacity="0.9" />
      <circle cx="62" cy="50" r="28" fill="var(--wl-blue)" opacity="0.55" />
      <path
        d="M45 51l7 7 15-17"
        stroke="var(--wl-ink)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DifferIcon() {
  return (
    <svg className="fc-takeaway__svg" viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <path
        d="M14 50c20 0 20-24 42-24"
        stroke="var(--wl-peach)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M14 50c20 0 20 24 42 24"
        stroke="var(--wl-pink)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="14" cy="50" r="6" fill="var(--wl-ink)" />
    </svg>
  );
}

function TalkIcon() {
  return (
    <svg className="fc-takeaway__svg" viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <rect x="10" y="20" width="52" height="34" rx="17" fill="var(--wl-lavender)" opacity="0.9" />
      <path d="M22 54l-4 12 14-8z" fill="var(--wl-lavender)" opacity="0.9" />
      <rect x="38" y="46" width="52" height="34" rx="17" fill="var(--wl-pink)" opacity="0.8" />
      <path d="M78 80l6 11-16-6z" fill="var(--wl-pink)" opacity="0.8" />
    </svg>
  );
}

const TAKEAWAYS = [
  {
    title: "Where you align",
    panel: "mint",
    icon: <AlignIcon />,
    text: "Some of your answers will match without either of you trying — a nice, quiet confirmation of something you already felt.",
  },
  {
    title: "Where you're different",
    panel: "peach",
    icon: <DifferIcon />,
    text: "Some won't. That's not a red flag — it's just a different way of seeing something, worth a closer look.",
  },
  {
    title: "What to talk about",
    panel: "lavender",
    icon: <TalkIcon />,
    text: "Either way, you'll have a short list of moments worth a real conversation — picked out by your own answers, not a script.",
  },
] as const;

export function ForCouplesTakeaways() {
  return (
    <section className="landing-section fc-takeaways">
      <p className="landing-eyebrow landing-eyebrow--plain fc-takeaways__eyebrow">
        What you&apos;ll get
      </p>
      <h2 className="landing-section__heading fc-takeaways__heading">
        Three things every couple takes away
      </h2>

      <div className="fc-takeaway-list">
        {TAKEAWAYS.map((item) => (
          <div className="fc-takeaway" key={item.title}>
            <div className={`fc-takeaway__panel fc-takeaway__panel--${item.panel}`}>
              {item.icon}
            </div>
            <div className="fc-takeaway__content">
              <h3 className="fc-takeaway__title">{item.title}</h3>
              <p className="fc-takeaway__text">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
