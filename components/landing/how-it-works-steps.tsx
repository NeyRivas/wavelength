/**
 * The four-step story (/how-it-works): Create → Share → Answer →
 * Discover. Each step reuses the exact motif vocabulary already
 * established by the homepage hero illustration (components/landing/
 * landing-hero.tsx) — bullseye circles, ringed dots, dashed trajectories,
 * arcs — rather than introducing generic numbered boxes or new icons, so
 * "wavelength" (waves, arcs, circles, overlap) stays visually present
 * throughout. No stock imagery, no illustrated people.
 */

function CreateIcon() {
  return (
    <svg className="hiw-step__svg" viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <circle cx="60" cy="60" r="42" stroke="var(--wl-lavender)" strokeWidth="12" />
      <circle cx="60" cy="60" r="24" fill="#ffffff" />
      <circle cx="60" cy="60" r="10" fill="var(--wl-ink)" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg className="hiw-step__svg" viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <path
        d="M28 78c14-28 50-40 68-16"
        stroke="var(--wl-muted)"
        strokeWidth="1.5"
        strokeDasharray="5 6"
      />
      <circle cx="28" cy="78" r="15" fill="#ffffff" stroke="var(--wl-pink)" strokeWidth="5" />
      <circle cx="28" cy="78" r="6" fill="var(--wl-ink)" />
      <circle cx="92" cy="46" r="15" fill="#ffffff" stroke="var(--wl-peach)" strokeWidth="5" />
      <circle cx="92" cy="46" r="6" fill="var(--wl-ink)" />
    </svg>
  );
}

function AnswerIcon() {
  return (
    <svg className="hiw-step__svg" viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <path
        d="M10 46c12-16 24-16 36 0s24 16 36 0 24-16 36 0"
        stroke="var(--wl-lavender)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M10 76c12-16 24-16 36 0s24 16 36 0 24-16 36 0"
        stroke="var(--wl-blue)"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DiscoverIcon() {
  return (
    <svg className="hiw-step__svg" viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <circle cx="48" cy="60" r="34" fill="var(--wl-mint)" opacity="0.7" />
      <circle cx="76" cy="60" r="34" fill="var(--wl-blue)" opacity="0.55" />
      <path
        d="M53 60l8 8 16-18"
        stroke="var(--wl-ink)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const STEPS = [
  {
    label: "Step 01",
    title: "Create",
    panel: "lavender",
    icon: <CreateIcon />,
    text: "Pick your questions from Wavelength's categories — relationship, money, adventures, the future, and more — or write your own. Then answer them yourself, first. Your answers stay private until your person joins in.",
  },
  {
    label: "Step 02",
    title: "Share",
    panel: "peach",
    icon: <ShareIcon />,
    text: "Once you've answered everything, Wavelength gives you one link. Send it to the one person you want to compare wavelengths with — it's just the two of you, one shared link.",
  },
  {
    label: "Step 03",
    title: "Answer",
    panel: "blue",
    icon: <AnswerIcon />,
    text: "They open your link and answer the exact same questions, independently — no peeking at your answers first. It only takes a couple of minutes, and it feels more like a game than a form.",
  },
  {
    label: "Step 04",
    title: "Discover",
    panel: "mint",
    icon: <DiscoverIcon />,
    text: "See exactly where your answers line up and where you see things differently. It's not a science, and no score decides whether you belong together — it's simply something worth talking about.",
  },
] as const;

export function HowItWorksSteps() {
  return (
    <section className="landing-section hiw-steps-section">
      <div className="hiw-steps">
        {STEPS.map((step, i) => (
          <div className={`hiw-step${i % 2 === 1 ? " hiw-step--reverse" : ""}`} key={step.title}>
            <div className={`hiw-step__panel hiw-step__panel--${step.panel}`}>{step.icon}</div>
            <div className="hiw-step__content">
              <p className="landing-eyebrow landing-eyebrow--plain hiw-step__eyebrow">
                {step.label}
              </p>
              <h2 className="hiw-step__title">{step.title}</h2>
              <p className="hiw-step__text">{step.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
