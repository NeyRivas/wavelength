"use client";

import { m, type Variants } from "motion/react";

import { MotionRoot } from "@/components/overprint/motion-root";

/**
 * The three steps, drawn with the same two discs as the hero: you answer
 * alone, they answer alone (the discs stay apart, nobody sees the other's
 * answers), then you compare and the overlap prints. It's a real
 * sequence, so it's numbered and plays once, in order, when it scrolls
 * into view. Copy and content render on the server either way; only the
 * discs move.
 */

const STEPS = [
  {
    title: "You answer",
    text: "Pick a game and answer on your own. Go with your gut.",
  },
  {
    title: "They answer",
    text: "Send them the link. They answer the same questions without seeing yours.",
  },
  {
    title: "You compare",
    text: "See where you overlap, and where you don't.",
  },
] as const;

const sequence: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.35 } },
};

const frame: Variants = {
  hidden: { opacity: 0.35 },
  shown: { opacity: 1, transition: { duration: 0.4 } },
};

const fromLeft: Variants = {
  hidden: { x: "-28%" },
  shown: { x: 0, transition: { type: "spring", stiffness: 140, damping: 18 } },
};

const fromRight: Variants = {
  hidden: { x: "28%" },
  shown: { x: 0, transition: { type: "spring", stiffness: 140, damping: 18 } },
};

function StepVisual({ step }: { step: number }) {
  if (step === 0) {
    return (
      <m.span className="op-step__discs op-step__discs--one" variants={frame}>
        <m.span className="op-disc op-disc--you" variants={fromLeft} />
      </m.span>
    );
  }
  if (step === 1) {
    return (
      <m.span className="op-step__discs op-step__discs--apart" variants={frame}>
        <m.span className="op-disc op-disc--you op-disc--quiet" variants={fromLeft} />
        <m.span className="op-disc op-disc--them" variants={fromRight} />
      </m.span>
    );
  }
  return (
    <m.span className="op-step__discs op-step__discs--overlap" variants={frame}>
      <m.span className="op-disc op-disc--you" variants={fromLeft} />
      <m.span className="op-disc op-disc--them" variants={fromRight} />
    </m.span>
  );
}

export function LandingHowItWorks() {
  return (
    <MotionRoot>
      <section id="how-it-works" className="op-section op-how" aria-labelledby="how-heading">
        <h2 id="how-heading" className="op-section__heading">
          How it works
        </h2>
        <m.ol
          className="op-how__steps"
          variants={sequence}
          initial="hidden"
          whileInView="shown"
          viewport={{ once: true, amount: 0.4 }}
        >
          {STEPS.map((step, index) => (
            <li key={step.title} className="op-step">
              <span className="op-step__visual" aria-hidden="true">
                <StepVisual step={index} />
              </span>
              <div className="op-step__copy">
                <h3 className="op-step__title">
                  <span className="op-step__number" aria-hidden="true">
                    {index + 1}
                  </span>
                  {step.title}
                </h3>
                <p className="op-step__text">{step.text}</p>
              </div>
            </li>
          ))}
        </m.ol>
      </section>
    </MotionRoot>
  );
}
