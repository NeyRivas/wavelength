"use client";

import { useEffect, useState } from "react";

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
 * Several example questions covering both real question types (feedback
 * pass: "make the question preview a REAL carousel") — Choice and Scale
 * only, never Situation. Card tints are deliberately limited to pink/
 * blue/mint/lavender (never peach): peach is reserved as the one
 * consistent "selected" accent for both Choice and Scale options below,
 * so a selected pill never visually blends into a same-hue card
 * background.
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

function ChoiceOptions({ options }: { options: string[] }) {
  const [selected, setSelected] = useState(1);

  return (
    <div className="landing-demo__options">
      {options.map((label, index) => (
        <button
          key={label}
          type="button"
          className={`landing-demo__option${
            selected === index ? " landing-demo__option--selected" : ""
          }`}
          onClick={() => setSelected(index)}
        >
          <span className="landing-demo__option-avatar">{OPTION_KEYS[index]}</span>
          {label}
        </button>
      ))}
    </div>
  );
}

function ScaleOptions() {
  const [selected, setSelected] = useState<number>(75);

  return (
    <div className="landing-demo__scale">
      {SCALE_VALUES.map((value) => (
        <button
          key={value}
          type="button"
          className={`landing-demo__scale-option${
            selected === value ? " landing-demo__scale-option--selected" : ""
          }`}
          onClick={() => setSelected(value)}
        >
          {SCALE_LABELS[value]}
        </button>
      ))}
    </div>
  );
}

/**
 * "The experience" question preview (Figma reference, screenshot 3),
 * turned into a genuinely working carousel. Presentational/demo only:
 * nothing here reads or writes a real Wavelength, calls a Server Action,
 * or touches Supabase — the actual questionnaire/answering flow is
 * completely untouched. Each example keeps its own transient selection
 * (a fresh `key={activeIndex}` remount on navigation — "it is fine for
 * each example to maintain its own temporary selection" per the brief),
 * and the indicator row + tag/footer chrome stay outside that remounted
 * subtree so clicking an indicator doesn't lose its own focus.
 *
 * Optional slow autoplay (every 6s) is disabled entirely under
 * prefers-reduced-motion and permanently paused the moment anyone
 * interacts with the card (an indicator, a Choice option, or a Scale
 * level) — manual navigation always still works either way.
 */
export function ExperienceDemoCard() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplayPaused, setAutoplayPaused] = useState(false);

  useEffect(() => {
    if (autoplayPaused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % EXAMPLES.length);
    }, AUTOPLAY_MS);

    return () => clearInterval(timer);
  }, [autoplayPaused]);

  const current = EXAMPLES[activeIndex]!;

  return (
    <div className="landing-demo">
      <div
        className={`landing-demo__card landing-demo__card--${current.tint}`}
        onClick={() => setAutoplayPaused(true)}
      >
        <div className="landing-demo__head">
          <span className="landing-demo__tag">{current.tag}</span>
          <div className="landing-demo__dots" role="group" aria-label="Example questions">
            {EXAMPLES.map((_, index) => (
              <button
                key={index}
                type="button"
                className={`landing-demo__indicator${index === activeIndex ? " is-active" : ""}`}
                aria-label={`Show example question ${index + 1} of ${EXAMPLES.length}`}
                aria-current={index === activeIndex ? "true" : undefined}
                onClick={() => {
                  setAutoplayPaused(true);
                  setActiveIndex(index);
                }}
              />
            ))}
          </div>
        </div>

        <div className="landing-demo__slide" key={activeIndex}>
          <h3 className="landing-demo__question">{current.question}</h3>
          {current.type === "choice" ? (
            <ChoiceOptions options={current.options} />
          ) : (
            <ScaleOptions />
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
      </div>
      <p className="landing-demo__hint">
        Click an answer to try it <span aria-hidden="true">↑</span>
      </p>
    </div>
  );
}
