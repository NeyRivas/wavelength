import { ExperienceDemoCard } from "./experience-demo-card";

const PILLS: { label: string; className: string }[] = [
  { label: "6 categories", className: "landing-pill--lavender" },
  { label: "Instant results", className: "landing-pill--mint" },
  { label: "No app needed", className: "landing-pill--peach" },
  { label: "Share any way", className: "landing-pill--pink" },
];

/** "The experience" (Figma reference, screenshot 3): copy + pill row on
 * the left, the interactive question mockup on the right inside a soft
 * halo. */
export function LandingExperience() {
  return (
    <section className="landing-section landing-experience landing-experience--home">
      <div className="landing-experience__content">
        <p className="landing-eyebrow landing-eyebrow--plain">The experience</p>
        <h2 className="landing-section__heading">Questions that actually start conversations</h2>
        <p className="landing-section__text">
          Our question library covers everything from life priorities to midnight cravings. Or write
          your own — the weirder the better.
        </p>

        <div className="landing-pill-row">
          {PILLS.map((pill) => (
            <span key={pill.label} className={`landing-pill ${pill.className}`}>
              {pill.label}
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
