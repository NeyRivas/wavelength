"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { SCALE_LABELS, SCALE_VALUES } from "@/lib/wavelength/categories";

type Tint = "pink" | "blue" | "mint" | "lavender";

type ChoiceExample = {
  type: "choice";
  tag: string;
  tint: Tint;
  question: string;
  options: string[];
};

type ScaleExample = {
  type: "scale";
  tag: string;
  tint: Tint;
  question: string;
};

type Example = ChoiceExample | ScaleExample;

/**
 * Several example questions covering both real question types — Choice
 * and Scale only, never Situation. Card tints are deliberately limited to
 * pink/blue/mint/lavender (never peach): peach is reserved as the one
 * consistent "selected" accent below, so the illustrated selection never
 * visually blends into a same-hue card background.
 */
const EXAMPLES: Example[] = [
  {
    type: "choice",
    tag: "Money",
    tint: "pink",
    question: "What matters more to you?",
    options: ["Saving for later", "Spending it now"],
  },
  {
    type: "scale",
    tag: "Future",
    tint: "blue",
    question: "How important is having financial stability to you?",
  },
  {
    type: "choice",
    tag: "Lifestyle",
    tint: "mint",
    question: "How do you like to spend a free weekend?",
    options: ["Going somewhere new", "Staying in", "Seeing friends", "A little of both"],
  },
  {
    type: "scale",
    tag: "Relationship",
    tint: "lavender",
    question: "How important is spontaneity to you?",
  },
];

const OPTION_KEYS = ["A", "B", "C", "D"] as const;
const AUTOPLAY_MS = 6000;

// A fixed illustrative "answer" for each question type — purely a static
// visual (this card has no interactive state of its own), echoing the real
// product's UI without inviting a click on any option.
const CHOICE_PREVIEW_INDEX = 1;
const SCALE_PREVIEW_VALUE = 75;

function ChoicePreview({ options }: { options: string[] }) {
  return (
    <div className="landing-demo__options">
      {options.map((label, index) => (
        <span
          key={label}
          className={`landing-demo__option${
            index === CHOICE_PREVIEW_INDEX ? " landing-demo__option--selected" : ""
          }`}
        >
          <span className="landing-demo__option-avatar">{OPTION_KEYS[index]}</span>
          {label}
        </span>
      ))}
    </div>
  );
}

function ScalePreview() {
  return (
    <div className="landing-demo__scale">
      {SCALE_VALUES.map((value) => (
        <span
          key={value}
          className={`landing-demo__scale-option${
            value === SCALE_PREVIEW_VALUE ? " landing-demo__scale-option--selected" : ""
          }`}
        >
          {SCALE_LABELS[value]}
        </span>
      ))}
    </div>
  );
}

/**
 * "The experience" question preview. Purely a visual illustration of the
 * product, not a working demo: nothing here reads or writes a real
 * Wavelength, calls a Server Action, or touches Supabase, and nothing
 * inside it is separately clickable. The whole card is one accessible
 * link to /play — the real "what are you playing?" entry point — with an
 * accessible name that makes clear this is a preview, not a form to fill
 * in. The example question rotates automatically (disabled under
 * prefers-reduced-motion) as ambient decoration; the indicator dots are a
 * non-interactive progress readout for that rotation, not controls.
 */
export function ExperienceDemoCard() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % EXAMPLES.length);
    }, AUTOPLAY_MS);

    return () => clearInterval(timer);
  }, []);

  const current = EXAMPLES[activeIndex]!;

  return (
    <div className="landing-demo">
      <Link
        href="/play"
        className={`landing-demo__card landing-demo__card--${current.tint}`}
        aria-label="Preview of an example question — select to start a real Sameeeish questionnaire"
      >
        <div className="landing-demo__head">
          <span className="landing-demo__tag">{current.tag}</span>
          <div className="landing-demo__dots" aria-hidden="true">
            {EXAMPLES.map((_, index) => (
              <span
                key={index}
                className={`landing-demo__indicator${index === activeIndex ? " is-active" : ""}`}
              />
            ))}
          </div>
        </div>

        <div className="landing-demo__slide" key={activeIndex}>
          <h3 className="landing-demo__question">{current.question}</h3>
          {current.type === "choice" ? (
            <ChoicePreview options={current.options} />
          ) : (
            <ScalePreview />
          )}
        </div>

        <div className="landing-demo__footer">
          <span>
            Example {activeIndex + 1} of {EXAMPLES.length}
          </span>
          <span className="landing-demo__progress" aria-hidden="true">
            {EXAMPLES.map((_, index) => (
              <span key={index} className={index <= activeIndex ? "is-filled" : ""} />
            ))}
          </span>
        </div>
      </Link>
      <p className="landing-demo__hint">Just a preview — tap to play for real</p>
    </div>
  );
}
