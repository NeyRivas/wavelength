import {
  MAX_QUESTIONS,
  MIN_QUESTIONS,
  RECOMMENDED_QUESTION_COUNT,
} from "@/lib/wavelength/categories";

/**
 * The single progress readout shown at the top of /create in both stages
 * (Figma reference: "0 of 5 questions ready" → "3 of 5 questions ready" →
 * "5 of 12 questions ready"). The target denominator is MIN_QUESTIONS
 * until that minimum is reached, then MAX_QUESTIONS — exactly the two
 * thresholds the existing product rules already use (see
 * questionnaire-builder.tsx's `canFinalize`/`atMax`), just read out as one
 * number instead of prose. Purely presentational: it reads `current`
 * (the actual question count) and renders a label + bar, nothing here
 * enforces or changes the 5–12 rule itself.
 *
 * Visual pass: adds one small, purely decorative reference row —
 * "5 Minimum · 8 Recommended · 12 Maximum" as three evenly-spaced mini
 * labels — so the same three numbers already governing this bar
 * (MIN_QUESTIONS/RECOMMENDED_QUESTION_COUNT/MAX_QUESTIONS, all existing
 * constants, no new numbers) are legible at a glance. Deliberately NOT
 * positioned proportionally along the bar's own width: the bar's width
 * represents progress toward MIN_QUESTIONS before that's reached and
 * toward MAX_QUESTIONS after, so a proportional "8" mark would sit in a
 * different, confusing spot depending on stage. Evenly-spaced tick labels
 * avoid that entirely and read correctly at every question count.
 * `aria-hidden` since it's a redundant, decorative restatement of the
 * same fixed rule — the accessible progress announcement (the
 * `role="progressbar"` below plus its existing text label) is unchanged.
 */
export function CreateProgress({ current }: { current: number }) {
  const target = current < MIN_QUESTIONS ? MIN_QUESTIONS : MAX_QUESTIONS;
  const fraction = Math.min(1, current / target);

  return (
    <div className="create-progress">
      <div
        className="create-progress__track"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-label="Questions ready"
      >
        <div className="create-progress__fill" style={{ width: `${fraction * 100}%` }} />
      </div>
      <div className="create-progress__milestones" aria-hidden="true">
        <span className="create-progress__milestone">
          <strong>{MIN_QUESTIONS}</strong> Minimum
        </span>
        <span className="create-progress__milestone create-progress__milestone--recommended">
          <strong>{RECOMMENDED_QUESTION_COUNT}</strong> Recommended
        </span>
        <span className="create-progress__milestone">
          <strong>{MAX_QUESTIONS}</strong> Maximum
        </span>
      </div>
      <p className="create-progress__label">
        {current} of {target} questions ready
      </p>
    </div>
  );
}
