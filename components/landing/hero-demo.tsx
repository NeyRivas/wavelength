"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";

import { CATEGORY_TINTS, tintForIndex } from "@/components/questionnaire/category-visuals";
import { AlignmentBadge } from "@/components/result/alignment-badge";
import { ProgressDots } from "@/components/result/cards/progress-dots";
import { RESULT_CARDS } from "@/components/result/cards/result-card-content";
import cardStyles from "@/components/result/cards/result-cards.module.css";
import { BrandMark } from "@/components/result/cards/wave-motifs";
import { WavelengthIndicator } from "@/components/result/wavelength-indicator";
import { alignmentLevel } from "@/lib/scoring/score";
import {
  CATEGORY_LABELS,
  SCALE_LABELS,
  SCALE_VALUES,
  type Category,
} from "@/lib/wavelength/categories";
import { getReadyMadeGame } from "@/lib/wavelength/ready-made-games";
import { ALIGNMENT_INTERPRETATION } from "@/lib/wavelength/result";
import { GRADIENT_PRESETS, type ResultCardsData } from "@/lib/wavelength/result-cards";

import styles from "./hero-demo.module.css";
import {
  DEMO_CAPTIONS,
  DEMO_CHOICE_PICK,
  DEMO_DURATION_MS,
  DEMO_SCALE_PICK,
  DEMO_SCENES,
  DEMO_SCORE,
  REDUCED_MOTION_FRAME_MS,
  getDemoFrame,
  type CursorTarget,
  type DemoFrame,
} from "./hero-demo-timeline";

/**
 * The hero's motion graphic: how Sameeeish works, drawn with the app's own
 * UI rather than a lookalike. Every screen reuses the real class names
 * (quiz stepper, invitation card, result summary, category cards) and the
 * real components (WavelengthIndicator, AlignmentBadge, the share cards and
 * their CSS module), so the demo keeps matching the product as it changes.
 * The choreography lives in hero-demo-timeline.ts.
 *
 * The scenes are laid out on a fixed 640×740 stage and scaled to fit the
 * column. A pointer walks through them; its targets are found by
 * `data-demo-target` and measured from layout offsets, which ignore CSS
 * transforms, so the stage's scale and the scenes' entrance animations
 * never throw it off.
 *
 * The whole visual is aria-hidden (a visually hidden summary describes it);
 * the scene tabs and the pause button underneath are real controls. It
 * only ticks while on screen and while the tab is visible, and under
 * prefers-reduced-motion it holds a still frame of the result until the
 * visitor presses play.
 */

const STAGE_WIDTH = 640;
const TICK_MS = 50;
/** Breathing room left under the result page once it has scrolled. */
const RESULT_SCROLL_MARGIN = 28;

const ALIAS_A = "Alex";
const ALIAS_B = "Sam";
const INVITE_LINK = "https://sameeeish.com/w/k3x9Qm2LpT";

// The ready-made couples quiz ("Are we on the same page?"): one choice
// question and its scale question, exactly as the stepper shows them.
const QUIZ = getReadyMadeGame("how-well-do-you-know-each-other")?.questions ?? [];
const QUIZ_TOTAL = QUIZ.length;
const CHOICE_INDEX = 3;
const SCALE_INDEX = QUIZ.findIndex((question) => question.type === "scale");
const CHOICE_QUESTION = QUIZ[CHOICE_INDEX];
const SCALE_QUESTION = QUIZ[SCALE_INDEX];
const SCALE_OPTIONS = SCALE_VALUES.map((value) => SCALE_LABELS[value]);

// A plausible 12-question result: 77% overall, highest alignment first.
const DEMO_CATEGORIES: { category: Category; score: number }[] = [
  { category: "relationship", score: 100 },
  { category: "lifestyle", score: 75 },
  { category: "future", score: 58 },
  { category: "money", score: 50 },
];
const DEMO_LEVEL = alignmentLevel(DEMO_SCORE);
const ALIGNED_LABELS = DEMO_CATEGORIES.filter(
  (c) => alignmentLevel(c.score) === "High Alignment",
).map((c) => CATEGORY_LABELS[c.category]);
const DIFFERENT_LABELS = DEMO_CATEGORIES.filter(
  (c) => alignmentLevel(c.score) !== "High Alignment",
).map((c) => CATEGORY_LABELS[c.category]);

interface Clock {
  t: number;
  /** The visitor picked a scene or pressed play (ends the reduced-motion still). */
  touched: boolean;
  /** How far the result page has scrolled (stage px, ≤ 0). */
  scroll: number;
  cursor: { x: number; y: number };
}

const INITIAL_CLOCK: Clock = { t: 0, touched: false, scroll: 0, cursor: { x: 560, y: 720 } };

/** Layout position of an element's center relative to the stage, ignoring transforms. */
function centerWithin(el: HTMLElement, stage: HTMLElement): { x: number; y: number } | null {
  let x = el.offsetWidth / 2;
  let y = el.offsetHeight / 2;
  let node: HTMLElement | null = el;
  while (node && node !== stage) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return node === stage ? { x, y } : null;
}

function measureResultScroll(stage: HTMLElement): number {
  const categories = stage.querySelector<HTMLElement>("[data-demo-categories]");
  if (!categories) return 0;
  const center = centerWithin(categories, stage);
  if (!center) return 0;
  const bottom = center.y + categories.offsetHeight / 2;
  return -Math.max(0, bottom - (stage.offsetHeight - RESULT_SCROLL_MARGIN));
}

function resolveClock(t: number, prev: Clock, stage: HTMLElement | null): Clock {
  const frame = getDemoFrame(t);
  let scroll = 0;
  if (frame.result.scrolled) {
    scroll = prev.scroll !== 0 ? prev.scroll : stage ? measureResultScroll(stage) : 0;
  }

  let cursor = prev.cursor;
  if (!frame.cursor.target) {
    cursor = frame.cursor.rest;
  } else if (stage) {
    const el = stage.querySelector<HTMLElement>(`[data-demo-target="${frame.cursor.target}"]`);
    const center = el ? centerWithin(el, stage) : null;
    if (el && center) {
      // Point a little left of center, like a hand reaching for the label.
      const nudge = Math.min(el.offsetWidth * 0.18, 70);
      cursor = {
        x: center.x - nudge,
        y: center.y + (el.closest("[data-demo-scroll]") ? scroll : 0),
      };
    }
  }

  return { t, touched: prev.touched, scroll, cursor };
}

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function subscribePageVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

export function HeroDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
  const pageVisible = useSyncExternalStore(
    subscribePageVisibility,
    () => !document.hidden,
    () => true,
  );

  const [playing, setPlaying] = useState<boolean | null>(null);
  const [onScreen, setOnScreen] = useState(true);
  const [scale, setScale] = useState<number | null>(null);
  const [clock, setClock] = useState<Clock>(INITIAL_CLOCK);
  const clockRef = useRef<Clock>(INITIAL_CLOCK);

  const isPlaying = playing ?? !reducedMotion;
  const running = isPlaying && onScreen && pageVisible;
  const t = reducedMotion && !clock.touched ? REDUCED_MOTION_FRAME_MS : clock.t;
  const frame = getDemoFrame(t, { paused: !isPlaying });

  const commit = useCallback((next: Clock) => {
    clockRef.current = next;
    setClock(next);
  }, []);

  // Fit the 640px stage to the column.
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setScale(entry.contentRect.width / STAGE_WIDTH);
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  // Only animate while the demo is on screen.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry) setOnScreen(entry.isIntersecting);
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const prev = clockRef.current;
      commit(resolveClock((prev.t + TICK_MS) % DEMO_DURATION_MS, prev, stageRef.current));
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [running, commit]);

  const jumpTo = (index: number) => {
    const scene = DEMO_SCENES[index];
    if (!scene) return;
    const time = isPlaying ? scene.start : scene.still;
    commit(resolveClock(time, { ...clockRef.current, scroll: 0, touched: true }, stageRef.current));
  };

  const togglePlaying = () => {
    if (!isPlaying && reducedMotion && !clockRef.current.touched) {
      commit({ ...clockRef.current, t: REDUCED_MOTION_FRAME_MS, touched: true });
    }
    setPlaying(!isPlaying);
  };

  const sceneClass = `${styles.scene} ${frame.leaving ? styles.leaving : ""}`;
  const pressing = (target: CursorTarget) =>
    frame.cursor.pressing && frame.cursor.target === target;

  return (
    <div ref={rootRef} className={styles.demo}>
      <p className="sr-only">
        A short animation of how Sameeeish works: you answer choice and scale questions one at a
        time, copy your private invitation link, your partner answers the same questions, your
        result shows how in sync you are overall and by category, and you can share it as four image
        cards.
      </p>

      <div ref={boxRef} className={styles.box} aria-hidden="true">
        <div
          className={styles.inner}
          style={scale ? ({ "--demo-scale": scale } as CSSProperties) : undefined}
        >
          <div ref={stageRef} className={styles.stage}>
            {frame.sceneIndex === 0 && <QuestionsScene frame={frame} className={sceneClass} />}
            {frame.sceneIndex === 1 && (
              <InviteScene frame={frame} className={`${sceneClass} ${styles.sceneInvite}`} />
            )}
            {frame.sceneIndex === 2 && (
              <ResultScene
                frame={frame}
                scroll={clock.scroll}
                sharePressed={pressing("share-result")}
                className={`${sceneClass} ${styles.sceneResult}`}
              />
            )}
            {frame.sceneIndex === 3 && (
              <ShareScene
                frame={frame}
                arrowPressed={pressing("next-card")}
                sharePressed={pressing("share-cards")}
                className={`${sceneClass} ${styles.sceneShare}`}
              />
            )}

            <div
              className={`${styles.cursor} ${frame.cursor.visible ? styles.cursorVisible : ""}`}
              style={{ transform: `translate(${clock.cursor.x}px, ${clock.cursor.y}px)` }}
            >
              {frame.cursor.clicking && <span className={styles.ripple} />}
              <svg
                className={`${styles.pointer} ${frame.cursor.pressing ? styles.pointerPressed : ""}`}
                width="30"
                height="30"
                viewBox="0 0 24 24"
              >
                <path
                  d="M5 3l14 7.5-6.2 1.6L10 18.5z"
                  fill="#181820"
                  stroke="#ffffff"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.captions} aria-hidden="true">
        {DEMO_CAPTIONS.map((caption, i) => (
          <p
            key={caption.start}
            className={styles.caption}
            data-state={
              i === frame.captionIndex ? "current" : i < frame.captionIndex ? "past" : "next"
            }
          >
            {caption.tag && <span className={styles.captionTag}>{caption.tag}</span>}
            {caption.text}
          </p>
        ))}
      </div>

      <div className={styles.controls} role="group" aria-label="Demo scenes">
        {DEMO_SCENES.map((scene, i) => {
          const fill = i < frame.sceneIndex ? 1 : i > frame.sceneIndex ? 0 : frame.sceneProgress;
          return (
            <button
              key={scene.id}
              type="button"
              className={styles.tab}
              aria-pressed={i === frame.sceneIndex}
              onClick={() => jumpTo(i)}
            >
              <span>{scene.label}</span>
              <span className={styles.tabTrack} aria-hidden="true">
                <span
                  className={styles.tabFill}
                  style={{ transform: `translateX(${(fill - 1) * 100}%)` }}
                />
              </span>
            </button>
          );
        })}
        <button
          type="button"
          className={styles.playToggle}
          aria-label={isPlaying ? "Pause demo" : "Play demo"}
          onClick={togglePlaying}
        >
          {isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="5" width="4" height="14" rx="1.2" />
              <rect x="14" y="5" width="4" height="14" rx="1.2" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

/* ── Scene 1: the quiz stepper (components/quiz/quiz-stepper.tsx) ─────── */

function QuestionsScene({ frame, className }: { frame: DemoFrame; className: string }) {
  const { showScale, choicePicked, scalePicked } = frame.questions;
  const index = showScale ? SCALE_INDEX : CHOICE_INDEX;
  const question = showScale ? SCALE_QUESTION : CHOICE_QUESTION;
  if (!question) return null;

  const options = showScale ? SCALE_OPTIONS : (question.options ?? []);
  const picked = showScale ? scalePicked : choicePicked;
  const pickIndex = showScale ? DEMO_SCALE_PICK : DEMO_CHOICE_PICK;
  const answered = index + (picked ? 1 : 0);

  return (
    <div className={className}>
      <div className="quiz">
        <div className="create-progress quiz__progress">
          <div className="create-progress__track">
            <div
              className="create-progress__fill"
              style={{ width: `${(answered / QUIZ_TOTAL) * 100}%` }}
            />
          </div>
          <p className="create-progress__label">
            {answered} of {QUIZ_TOTAL} answered
          </p>
        </div>

        <section
          key={index}
          className={`quiz-card quiz-card--${tintForIndex(index)} ${styles.quizCard} ${showScale ? styles.slideIn : ""}`}
        >
          <header className="quiz-card__head">
            <span>
              Question {index + 1} of {QUIZ_TOTAL}
            </span>
            <span className="quiz-card__status">{picked ? "Saved" : ""}</span>
          </header>
          <div className="quiz-card__body">
            <p className="quiz-card__question">{question.text}</p>
            <div className="quiz-options">
              {options.map((label, i) => (
                <span
                  key={label}
                  className={`quiz-option${picked && i === pickIndex ? " quiz-option--selected" : ""}`}
                  data-demo-target={
                    i === pickIndex ? (showScale ? "scale-option" : "choice-option") : undefined
                  }
                >
                  <span className="quiz-option__mark" />
                  <span className="quiz-option__label">{label}</span>
                </span>
              ))}
            </div>
            <div className="conv-actions">
              <span className="conv-button conv-button--secondary">← Previous</span>
              <span
                className="conv-button conv-button--primary"
                style={{ opacity: picked ? 1 : 0.45 }}
              >
                Next →
              </span>
            </div>
            <div className="quiz-card__footer">
              <p className="quiz-card__hint">
                Only you can see your answers until you&apos;ve both finished.
              </p>
              <span className="quiz-card__customize">Customize questions</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ── Scene 2: the invitation link (components/wavelength/share-view.tsx) ─ */

function InviteScene({ frame, className }: { frame: DemoFrame; className: string }) {
  const { copied, joined } = frame.invite;
  return (
    <div className={className}>
      <section className={`share-card ${styles.shareCard}`}>
        <p className="share-card__label">Your invitation link</p>
        <div className="share-card__link-row">
          <span className={`share-link ${styles.shareLink}`}>{INVITE_LINK}</span>
          <span
            className={`share-copy-button${copied ? " share-copy-button--copied" : ""}`}
            data-demo-target="copy-link"
          >
            {copied ? (
              "✓ Link copied"
            ) : (
              <>
                <svg className="share-copy-button__icon" viewBox="0 0 20 20" fill="none">
                  <rect
                    x="7"
                    y="7"
                    width="9"
                    height="9"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M13 7V5.5A1.5 1.5 0 0 0 11.5 4h-7A1.5 1.5 0 0 0 3 5.5v7A1.5 1.5 0 0 0 4.5 14H6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
                Copy link
              </>
            )}
          </span>
        </div>
        <p className="share-status">
          <span
            className={`share-status__dot share-status__dot--${joined ? "joined" : "waiting"}`}
          />
          {joined
            ? `${ALIAS_B} has joined and is answering — you’ll see the result once they finish.`
            : "Waiting for someone to open your link."}
        </p>
      </section>
    </div>
  );
}

/* ── Scene 3: the result page (result-reveal.tsx, global-summary.tsx, ──── */
/*    result-actions.tsx, category-summary.tsx)                           */

function ResultScene({
  frame,
  scroll,
  sharePressed,
  className,
}: {
  frame: DemoFrame;
  scroll: number;
  sharePressed: boolean;
  className: string;
}) {
  const { phase, meterScore, detailsVisible } = frame.result;

  if (phase !== "revealed") {
    return (
      <div className={className}>
        <div
          className={`wavelength-loading${phase === "ready" ? " wavelength-loading--ready" : ""} ${styles.loading}`}
        >
          <svg className="wavelength-loading__motif" viewBox="0 0 200 80" fill="none">
            <path
              d="M20 40c30-24 60-24 80 0s50 24 80 0"
              stroke="var(--wl-muted)"
              strokeWidth="1.5"
              strokeDasharray="5 6"
            />
            <circle
              className="wavelength-loading__glow"
              cx="100"
              cy="40"
              r="16"
              fill="var(--wl-mint)"
            />
            <circle
              className="wavelength-loading__dot wavelength-loading__dot--a"
              cx="20"
              cy="40"
              r="9"
              fill="#ffffff"
              stroke="var(--wl-lavender)"
              strokeWidth="4"
            />
            <circle
              className="wavelength-loading__dot wavelength-loading__dot--b"
              cx="180"
              cy="40"
              r="9"
              fill="#ffffff"
              stroke="var(--wl-blue)"
              strokeWidth="4"
            />
          </svg>
          <p className="wavelength-loading__text">
            {phase === "finding" ? "Finding your result…" : "See your results"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        className={styles.resultContent}
        style={{ transform: `translateY(${scroll}px)` }}
        data-demo-scroll
      >
        <section className="global-summary">
          <div className="global-summary__glass">
            <p className="global-summary__eyebrow">Your compatibility result</p>
            <p className="global-summary__heading">
              Are {ALIAS_A} and {ALIAS_B} on the same page?
            </p>
            <WavelengthIndicator score={meterScore} level={DEMO_LEVEL} />
            <span className={styles.reveal} data-visible={detailsVisible}>
              <AlignmentBadge level={DEMO_LEVEL} />
            </span>
            <p className="global-summary__score">{meterScore}% aligned</p>
            <p
              className={`global-summary__interpretation ${styles.reveal}`}
              data-visible={detailsVisible}
            >
              {ALIGNMENT_INTERPRETATION[DEMO_LEVEL]}
            </p>
          </div>
        </section>

        <div className="result-actions">
          <span className="result-primary-button">
            <span className="result-primary-button__label">Create your own quiz</span>
          </span>
          <div className="result-actions__secondary">
            <span
              className="result-share-cta"
              data-demo-target="share-result"
              style={sharePressed ? { transform: "scale(0.95)" } : undefined}
            >
              <span className="result-share-cta__content">
                <ShareIcon className="result-share-cta__icon" />
                Share result
              </span>
            </span>
          </div>
        </div>

        <section className="result-section" data-demo-categories>
          <p className="result-section__heading">Categories</p>
          <div className={`category-grid ${styles.categoryGrid}`}>
            {DEMO_CATEGORIES.map((c) => (
              <div
                key={c.category}
                className={`category-card category-card--${CATEGORY_TINTS[c.category]}`}
              >
                <p className="category-card__label">{CATEGORY_LABELS[c.category]}</p>
                <p className="category-card__score">{c.score}%</p>
                <AlignmentBadge level={alignmentLevel(c.score)} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ── Scene 4: the share-cards overlay (components/result/cards) ───────── */

function ShareScene({
  frame,
  arrowPressed,
  sharePressed,
  className,
}: {
  frame: DemoFrame;
  arrowPressed: boolean;
  sharePressed: boolean;
  className: string;
}) {
  const { cardIndex, presetIndex, cardScore } = frame.share;
  const gradient = GRADIENT_PRESETS[presetIndex] ?? GRADIENT_PRESETS[0]!;
  const data: ResultCardsData = {
    aliasA: ALIAS_A,
    aliasB: ALIAS_B,
    score: cardIndex === 0 ? cardScore : DEMO_SCORE,
    alignedCategories: ALIGNED_LABELS,
    differentCategories: DIFFERENT_LABELS,
    gradient,
  };
  const CurrentCard = RESULT_CARDS[cardIndex] ?? RESULT_CARDS[0]!;
  const lastCard = RESULT_CARDS.length - 1;

  return (
    <div className={className}>
      <div className={styles.phoneSlot}>
        <div className={`${cardStyles.phone} ${styles.phone}`} style={{ width: 380 }}>
          {GRADIENT_PRESETS.map((preset, i) => (
            <div
              key={preset.name}
              className={`${cardStyles.bg} ${styles.presetLayer}`}
              style={
                {
                  "--c1": preset.c1,
                  "--c2": preset.c2,
                  opacity: i === presetIndex ? 1 : 0,
                } as CSSProperties
              }
            />
          ))}
          <div className={cardStyles.grain} />
          <div className={cardStyles.frame}>
            <div className={cardStyles.card}>
              <div className={cardStyles.top}>
                <div className={cardStyles.brand}>
                  <BrandMark className={cardStyles.brandMark} />
                  Sameeeish
                </div>
                <ProgressDots current={cardIndex} />
              </div>
              <div key={cardIndex} className={styles.cardContent}>
                <CurrentCard data={data} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={cardStyles.arrows}>
        <span className={cardStyles.arrowButton} style={{ opacity: cardIndex === 0 ? 0.35 : 1 }}>
          ←
        </span>
        <span
          className={cardStyles.arrowButton}
          data-demo-target="next-card"
          style={{
            opacity: cardIndex === lastCard ? 0.35 : 1,
            transform: arrowPressed ? "scale(0.9)" : undefined,
          }}
        >
          →
        </span>
      </div>

      <div className={cardStyles.presetRow}>
        {GRADIENT_PRESETS.map((preset, i) => (
          <span
            key={preset.name}
            className={[
              cardStyles.presetSwatch,
              i === presetIndex ? cardStyles.presetSwatchActive : "",
            ].join(" ")}
            style={{ background: `linear-gradient(135deg, ${preset.c1}, ${preset.c2})` }}
            data-demo-target={i >= 1 && i <= 3 ? `swatch-${i}` : undefined}
          />
        ))}
      </div>

      <div className={cardStyles.actionsRow}>
        <span
          className={cardStyles.primaryAction}
          data-demo-target="share-cards"
          style={sharePressed ? { transform: "scale(0.94)" } : undefined}
        >
          <ShareIcon />
          Share
        </span>
        <span className={cardStyles.actionButton}>Download</span>
      </div>
    </div>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 1.5v8M8 1.5L5 4.5M8 1.5l3 3"
        stroke="#181820"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 8.5v4a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-4"
        stroke="#181820"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
