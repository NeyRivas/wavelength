"use client";

import { useState } from "react";

const OPTIONS = [
  { key: "A", label: "Saving for later" },
  { key: "B", label: "Spending it now" },
] as const;

/**
 * The "MONEY" question mockup card (Figma reference, screenshot 3). The
 * reference shows one option pre-highlighted with a "Click an answer to
 * try it ↑" hint below it, implying a small interactive toggle in the
 * Figma prototype — reproduced here as local `useState` only. This is
 * presentational only: nothing here reads or writes a real Wavelength,
 * calls a Server Action, or touches Supabase — nothing about the actual
 * questionnaire/answering flow changes.
 */
export function ExperienceDemoCard() {
  const [selected, setSelected] = useState<"A" | "B">("B");

  return (
    <div className="landing-demo">
      <div className="landing-demo__card">
        <div className="landing-demo__head">
          <span className="landing-demo__tag">Money</span>
          <span className="landing-demo__dots" aria-hidden="true">
            <span />
            <span />
            <span className="is-active" />
          </span>
        </div>

        <h3 className="landing-demo__question">What matters more to you?</h3>

        <div className="landing-demo__options">
          {OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              className={`landing-demo__option${
                selected === option.key ? " landing-demo__option--selected" : ""
              }`}
              onClick={() => setSelected(option.key)}
            >
              <span className="landing-demo__option-avatar">{option.key}</span>
              {option.label}
            </button>
          ))}
        </div>

        <div className="landing-demo__footer">
          <span>Question 3 of 8</span>
          <span className="landing-demo__progress" aria-hidden="true">
            {Array.from({ length: 8 }, (_, i) => (
              <span key={i} className={i < 3 ? "is-filled" : ""} />
            ))}
          </span>
        </div>
      </div>
      <p className="landing-demo__hint">
        Click an answer to try it <span aria-hidden="true">↑</span>
      </p>
    </div>
  );
}
