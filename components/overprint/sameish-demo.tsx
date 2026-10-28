"use client";

import { AnimatePresence, m } from "motion/react";
import { useId, useState } from "react";

import { MotionRoot } from "./motion-root";

/**
 * The landing page's hero: a tiny, self-contained round of the actual game.
 * The visitor places their disc on a five-step answer scale; "their" disc
 * then lands on a pre-set answer, and the overlap between the two discs
 * (rendered with mix-blend-mode: multiply, so the shared area prints in a
 * deeper third colour) is how close you are. The verdict word is the
 * brand name itself, stretched or broken by distance.
 *
 * Purely a demonstration: nothing here reads or writes a Wavelength,
 * calls a Server Action, or touches Supabase. "Their" answers are fixed
 * per question and the questions are written for this demo only.
 *
 * Geometry: each disc is DISC% of the track's width and the five stops are
 * STEP% apart, chosen so one step apart overlaps heavily, three steps apart
 * barely kiss and four steps apart don't touch at all. Discs move with a
 * transform expressed as a percentage of their own width, so the layout
 * scales with the container and stays on the compositor.
 */

const DISC = 42;
const STEP = (100 - DISC) / 4;
const IDLE_YOURS = 1;
const IDLE_THEIRS = 3;

type DemoQuestion = {
  text: string;
  stops: [string, string, string, string, string];
  theirs: number;
};

const QUESTIONS: DemoQuestion[] = [
  {
    text: "Free Saturday. Where are you?",
    stops: ["On the couch", "Mostly home", "Could go either way", "Mostly out", "Out till late"],
    theirs: 3,
  },
  {
    text: "How much alone time do you need?",
    stops: ["None at all", "A little", "Some", "A lot", "Loads"],
    theirs: 2,
  },
  {
    text: "How fast do you text back?",
    stops: ["Instantly", "Within minutes", "Within the hour", "Later that day", "Days later"],
    theirs: 1,
  },
  {
    text: "How tidy is your place right now?",
    stops: ["Spotless", "Pretty tidy", "Lived in", "Messy", "Don't ask"],
    theirs: 2,
  },
];

const VERDICTS: { word: string; detail: string }[] = [
  { word: "Same.", detail: "Exactly the same answer." },
  { word: "Sameeeish.", detail: "One step apart. Close enough to call it." },
  { word: "Same-ish.", detail: "Two steps apart. Worth a chat." },
  { word: "Not quite.", detail: "Three steps apart. That's a good conversation." },
  { word: "Opposites.", detail: "Opposite ends. Now you have something to talk about." },
];

const INTRO = { word: "Sameeeish.", detail: "Tap where you land. Then see where they did." };

const discSpring = { type: "spring", stiffness: 170, damping: 22, mass: 0.9 } as const;

function discX(stop: number) {
  // Translate in percent of the disc's own width: STEP% of the track is
  // STEP / DISC of one disc.
  return `${((stop * STEP) / DISC) * 100}%`;
}

function StretchWord({ word }: { word: string }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <m.span
        key={word}
        className="op-demo__word"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.12 } }}
      >
        {Array.from(word).map((letter, index) => (
          <m.span
            key={index}
            className="op-demo__letter"
            initial={{ opacity: 0, y: "0.35em" }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 * index, type: "spring", stiffness: 380, damping: 26 }}
          >
            {letter}
          </m.span>
        ))}
      </m.span>
    </AnimatePresence>
  );
}

function Demo() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [yours, setYours] = useState<number | null>(null);
  const groupName = useId();
  const question = QUESTIONS[questionIndex]!;

  const answered = yours !== null;
  const verdict = answered ? VERDICTS[Math.abs(yours - question.theirs)]! : INTRO;
  const yoursAt = yours ?? IDLE_YOURS;
  const theirsAt = answered ? question.theirs : IDLE_THEIRS;

  function nextQuestion() {
    setYours(null);
    setQuestionIndex((index) => (index + 1) % QUESTIONS.length);
  }

  return (
    <div className="op-demo">
      <fieldset className="op-demo__fieldset">
        <AnimatePresence mode="wait" initial={false}>
          <m.legend
            key={question.text}
            className="op-demo__question"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {question.text}
          </m.legend>
        </AnimatePresence>

        <div className="op-demo__stage" aria-hidden="true">
          <m.span
            className="op-disc op-disc--you op-demo__disc"
            initial={{ x: discX(IDLE_YOURS - 1), scale: 0.92 }}
            animate={{ x: discX(yoursAt), scale: 1 }}
            transition={discSpring}
          >
            <span className="op-demo__disc-label">You</span>
          </m.span>
          <m.span
            className="op-disc op-disc--them op-demo__disc"
            initial={{ x: discX(IDLE_THEIRS + 1), scale: 0.92 }}
            animate={{ x: discX(theirsAt), scale: 1 }}
            transition={{ ...discSpring, delay: answered ? 0.35 : 0 }}
          >
            <span className="op-demo__disc-label">Them</span>
          </m.span>
        </div>

        <div className="op-demo__track">
          {question.stops.map((label, stop) => (
            <label
              key={stop}
              className="op-demo__stop"
              style={{ left: `${DISC / 2 + stop * STEP}%` }}
            >
              <input
                type="radio"
                name={groupName}
                value={stop}
                checked={yours === stop}
                onChange={() => setYours(stop)}
                className="op-demo__input"
              />
              <span className="op-demo__dot" aria-hidden="true" />
              <span className="op-visually-hidden">{label}</span>
            </label>
          ))}
        </div>
        <div className="op-demo__ends" aria-hidden="true">
          <span>{question.stops[0]}</span>
          <span>{question.stops[4]}</span>
        </div>
      </fieldset>

      <div className="op-demo__result">
        <p className="op-demo__verdict">
          <StretchWord word={verdict.word} />
        </p>
        <p className="op-demo__detail">{verdict.detail}</p>
        {answered && (
          <p className="op-demo__answers">
            You said “{question.stops[yours]}”. They said “{question.stops[question.theirs]}”.
          </p>
        )}
        <p className="op-visually-hidden" aria-live="polite">
          {answered
            ? `${verdict.word} ${verdict.detail} You said ${question.stops[yours]}. They said ${question.stops[question.theirs]}.`
            : ""}
        </p>
        <button type="button" className="op-demo__next" onClick={nextQuestion}>
          Try another question
        </button>
      </div>
    </div>
  );
}

export function SameishDemo() {
  return (
    <MotionRoot>
      <Demo />
    </MotionRoot>
  );
}
