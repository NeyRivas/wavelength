/**
 * Decorative experiment: a soft, playful backdrop for the questionnaire
 * answering screen (app/w/[token]/answer/page.tsx) only — loosely inspired
 * by wavelength.zone's playful geometric shapes (no assets or markup
 * reused from there), built from Sameeeish's own palette and the
 * two-wave "different rhythms coming together" motif already established
 * at components/landing/landing-hero.tsx. Purely decorative (aria-hidden,
 * pointer-events:none in CSS) and purely static markup — no client JS,
 * all motion is CSS animation (see the "answer-background" rules in
 * app/globals.css), which also owns prefers-reduced-motion handling.
 * Self-contained and easy to unmount/remove if the experiment doesn't
 * stick — nothing else references this component or its classes.
 */
export function AnswerBackground() {
  return (
    <div className="answer-background" aria-hidden="true">
      <div className="answer-background__blob answer-background__blob--a" />
      <div className="answer-background__blob answer-background__blob--b" />
      <div className="answer-background__blob answer-background__blob--c" />

      <svg
        className="answer-background__wave"
        viewBox="0 0 600 160"
        fill="none"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="answerBgWaveA" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--wl-lavender)" />
            <stop offset="100%" stopColor="var(--wl-pink)" />
          </linearGradient>
          <linearGradient id="answerBgWaveB" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--wl-blue)" />
            <stop offset="100%" stopColor="var(--wl-mint)" />
          </linearGradient>
        </defs>
        <g className="answer-background__wave-path answer-background__wave-path--a">
          <path
            d="M0 70c50-34 100-34 150 0s100 34 150 0 100-34 150 0 100 34 150 0"
            stroke="url(#answerBgWaveA)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
        <g className="answer-background__wave-path answer-background__wave-path--b">
          <path
            d="M0 102c50 28 100 28 150 0s100-28 150 0 100 28 150 0 100-28 150 0"
            stroke="url(#answerBgWaveB)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
      </svg>

      <span className="answer-background__dot answer-background__dot--1" />
      <span className="answer-background__dot answer-background__dot--2" />
      <span className="answer-background__dot answer-background__dot--3" />
      <span className="answer-background__dot answer-background__dot--4" />
      <span className="answer-background__dot answer-background__dot--5" />
    </div>
  );
}
