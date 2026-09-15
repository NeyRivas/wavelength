import { MAX_QUESTIONS, MIN_QUESTIONS } from "@/lib/wavelength/categories";

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
      <p className="create-progress__label">
        {current} of {target} questions ready
      </p>
    </div>
  );
}
