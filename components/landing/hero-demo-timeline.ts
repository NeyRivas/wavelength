/**
 * The hero demo's timeline (components/landing/hero-demo.tsx): one pure
 * function from "milliseconds into the loop" to everything the demo shows
 * at that moment, so the component itself only renders a frame and the
 * choreography can be unit-tested without a DOM.
 *
 * Four scenes, each drawn with the app's real UI:
 *   1. Questions — a choice question, then a scale question, in the quiz stepper
 *   2. Invite    — the invitation-link card: Copy link → partner joins
 *   3. Result    — "Finding your result…", then the result summary, whose
 *                  wavelength indicator works as the meter, and the categories
 *   4. Share     — the share-cards overlay: the four cards one by one, then
 *                  the gradient presets, then Share
 *
 * A pointer walks through it. Its targets are named here (`CursorTarget`)
 * and resolved to real element positions by the component, so the
 * choreography never depends on hard-coded pixel coordinates.
 */

export const DEMO_DURATION_MS = 28_400;

export interface DemoScene {
  id: "questions" | "invite" | "result" | "share";
  label: string;
  start: number;
  end: number;
  /** A representative still frame — what the tabs jump to while paused. */
  still: number;
}

export const DEMO_SCENES: readonly DemoScene[] = [
  { id: "questions", label: "Questions", start: 0, end: 5_600, still: 4_800 },
  { id: "invite", label: "Invite", start: 5_600, end: 9_400, still: 9_000 },
  { id: "result", label: "Result", start: 9_400, end: 16_600, still: 13_400 },
  { id: "share", label: "Share", start: 16_600, end: DEMO_DURATION_MS, still: 17_950 },
];

/** What a prefers-reduced-motion visitor sees: the result page with its meter. */
export const REDUCED_MOTION_FRAME_MS = 13_400;

/** The pointer's clicks, in loop time. */
export const DEMO_CLICKS_MS: readonly number[] = [
  1_300, // choice question: "Finding a solution"
  3_700, // scale question: "Very important"
  6_700, // Copy link
  15_600, // Share result
  19_000, // → card 2
  20_300, // → card 3
  21_600, // → card 4
  23_100, // gradient: Pink → Peach
  24_200, // gradient: Blue → Mint
  25_300, // gradient: Lavender → Pink
  27_400, // Share
];

const CLICK_RIPPLE_MS = 600;
const CLICK_PRESS_MS = 160;

/** The demo's result: 12 questions, 77% overall (see hero-demo.tsx). */
export const DEMO_SCORE = 77;

/** Index of the option the pointer picks on each question. */
export const DEMO_CHOICE_PICK = 1;
export const DEMO_SCALE_PICK = 3;

export type CursorTarget =
  | "choice-option"
  | "scale-option"
  | "copy-link"
  | "share-result"
  | "next-card"
  | "swatch-1"
  | "swatch-2"
  | "swatch-3"
  | "share-cards";

export interface DemoCaption {
  start: number;
  end: number;
  text: string;
  /** Short label in front of the caption (the question type), if any. */
  tag?: string;
}

export const DEMO_CAPTIONS: readonly DemoCaption[] = [
  { start: 0, end: 2_400, text: "Pick the answer that fits you", tag: "Choice" },
  { start: 2_400, end: 5_600, text: "How much does it matter to you?", tag: "Scale" },
  { start: 5_600, end: 6_700, text: "Copy your private link" },
  { start: 6_700, end: 7_900, text: "Send it to your partner" },
  { start: 7_900, end: 9_400, text: "They answer the same questions" },
  { start: 9_400, end: 10_950, text: "Once you’ve both finished…" },
  { start: 10_950, end: 13_600, text: "See how in sync you really are" },
  { start: 13_600, end: 16_600, text: "Where you align, category by category" },
  { start: 16_600, end: 18_200, text: "Your result, as shareable cards" },
  { start: 18_200, end: 21_900, text: "Four cards, one by one" },
  { start: 21_900, end: 26_100, text: "Pick the colors you like" },
  { start: 26_100, end: DEMO_DURATION_MS, text: "Share them anywhere" },
];

export interface DemoFrame {
  t: number;
  sceneIndex: number;
  /** 0–1 through the current scene (drives the tab progress bars). */
  sceneProgress: number;
  /** The last moments of a scene, while it fades out. */
  leaving: boolean;
  questions: {
    showScale: boolean;
    choicePicked: boolean;
    scalePicked: boolean;
  };
  invite: { copied: boolean; joined: boolean };
  result: {
    phase: "finding" | "ready" | "revealed";
    meterScore: number;
    detailsVisible: boolean;
    scrolled: boolean;
  };
  share: {
    cardIndex: number;
    presetIndex: number;
    cardScore: number;
  };
  cursor: {
    /** Where the pointer heads; `null` means its resting spot (`rest`). */
    target: CursorTarget | null;
    rest: { x: number; y: number };
    visible: boolean;
    pressing: boolean;
    clicking: boolean;
  };
  captionIndex: number;
}

function easeOutCubic(x: number): number {
  const clamped = Math.max(0, Math.min(1, x));
  return 1 - Math.pow(1 - clamped, 3);
}

function wrap(t: number): number {
  const mod = t % DEMO_DURATION_MS;
  return mod < 0 ? mod + DEMO_DURATION_MS : mod;
}

export function sceneIndexAt(t: number): number {
  const time = wrap(t);
  const index = DEMO_SCENES.findIndex((scene) => time >= scene.start && time < scene.end);
  return index === -1 ? 0 : index;
}

export function getDemoFrame(rawT: number, { paused = false } = {}): DemoFrame {
  const t = wrap(rawT);
  const sceneIndex = sceneIndexAt(t);
  const scene = DEMO_SCENES[sceneIndex]!;
  const local = t - scene.start;
  const duration = scene.end - scene.start;

  // Scene 1 — questions.
  const inQuestions = sceneIndex === 0;
  const choicePicked = !inQuestions || t >= 1_300;
  const scalePicked = !inQuestions || t >= 3_700;

  // Scene 2 — invite.
  const iv = t - DEMO_SCENES[1]!.start;
  const inInvite = sceneIndex === 1;

  // Scene 3 — result.
  const r = t - DEMO_SCENES[2]!.start;
  const inResult = sceneIndex === 2;
  const phase = r < 1_000 ? "finding" : r < 1_550 ? "ready" : "revealed";

  // Scene 4 — share cards.
  const q = t - DEMO_SCENES[3]!.start;
  const inShare = sceneIndex === 3;
  const cardIndex = !inShare ? 0 : q < 2_400 ? 0 : q < 3_700 ? 1 : q < 5_000 ? 2 : 3;
  // Indices into GRADIENT_PRESETS (lib/wavelength/result-cards.ts).
  const presetIndex = !inShare ? 0 : q < 6_500 ? 0 : q < 7_600 ? 2 : q < 8_700 ? 1 : 3;

  // The pointer.
  let target: CursorTarget | null = null;
  let rest = { x: 560, y: 720 };
  let visible = false;
  if (inQuestions) {
    visible = t >= 300 && t < 4_600;
    if (t >= 400 && t < 2_600) target = "choice-option";
    else if (t >= 2_600 && t < 4_600) target = "scale-option";
    else if (t >= 4_600) rest = { x: 590, y: 720 };
  } else if (inInvite) {
    rest = iv >= 2_200 ? { x: 600, y: 640 } : { x: 380, y: 600 };
    visible = iv >= 250 && iv < 2_200;
    if (iv >= 400 && iv < 2_200) target = "copy-link";
  } else if (inResult) {
    rest = { x: 430, y: 640 };
    visible = r >= 4_900 && r < 6_800;
    if (r >= 5_000) target = "share-result";
  } else {
    rest = { x: 430, y: 760 };
    visible = q >= 1_400 && q < 11_400;
    if (q >= 1_500 && q < 5_600) target = "next-card";
    else if (q >= 5_600 && q < 6_900) target = "swatch-2";
    else if (q >= 6_900 && q < 8_000) target = "swatch-1";
    else if (q >= 8_000 && q < 9_800) target = "swatch-3";
    else if (q >= 9_800) target = "share-cards";
  }
  const clicking = visible && DEMO_CLICKS_MS.some((c) => t >= c && t < c + CLICK_RIPPLE_MS);
  const pressing = DEMO_CLICKS_MS.some((c) => t >= c && t < c + CLICK_PRESS_MS);

  const captionIndex = DEMO_CAPTIONS.findIndex((c) => t >= c.start && t < c.end);

  return {
    t,
    sceneIndex,
    sceneProgress: Math.min(1, local / duration),
    leaving: !paused && local > duration - 380,
    questions: {
      showScale: inQuestions && t >= 2_400,
      choicePicked,
      scalePicked,
    },
    invite: {
      copied: inInvite && iv >= 1_100,
      joined: inInvite && iv >= 2_300,
    },
    result: {
      phase,
      meterScore: inResult ? Math.round(DEMO_SCORE * easeOutCubic((r - 1_700) / 1_500)) : 0,
      detailsVisible: inResult && r >= 3_100,
      scrolled: inResult && r >= 4_200,
    },
    share: {
      cardIndex,
      presetIndex,
      cardScore: Math.round(DEMO_SCORE * easeOutCubic((q - 300) / 1_200)),
    },
    cursor: { target, rest, visible, pressing, clicking },
    captionIndex,
  };
}
