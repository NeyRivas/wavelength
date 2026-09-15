import { ExperienceDemoCard } from "./experience-demo-card";

const CATEGORIES: { label: string; className: string }[] = [
  { label: "Money", className: "landing-pill--lavender" },
  { label: "Adventure", className: "landing-pill--mint" },
  { label: "The future", className: "landing-pill--peach" },
  { label: "Family", className: "landing-pill--pink" },
];

/**
 * "Small questions. Unexpected answers." Reuses the exact two-column
 * layout and demo-card mockup from the homepage's "experience" section
 * (components/landing/landing-experience.tsx /
 * components/landing/experience-demo-card.tsx) — same
 * pill-row-plus-halo-plus-card composition, same underlying component —
 * rather than building a second question mockup that does the same job.
 * This page's own framing lives in the copy (why these small questions
 * matter for two people who already know each other), not in a new
 * visual.
 */
export function ForCouplesQuestions() {
  return (
    <section className="landing-section landing-experience">
      <div className="landing-experience__content">
        <p className="landing-eyebrow">
          <span className="landing-eyebrow__dot landing-eyebrow__dot--pink" aria-hidden="true" />
          <span className="landing-eyebrow__dot landing-eyebrow__dot--blue" aria-hidden="true" />
          The questions
        </p>
        <h2 className="landing-section__heading">Small questions. Unexpected answers.</h2>
        <p className="landing-section__text">
          Nothing clinical, nothing scored. Just everyday questions about money, adventure, the
          future, and more — the kind you might never think to ask out loud, even after years
          together.
        </p>

        <div className="landing-pill-row">
          {CATEGORIES.map((category) => (
            <span key={category.label} className={`landing-pill ${category.className}`}>
              {category.label}
            </span>
          ))}
        </div>
      </div>

      <div className="landing-experience__demo">
        <div className="landing-experience__halo" aria-hidden="true" />
        <ExperienceDemoCard />
      </div>
    </section>
  );
}
