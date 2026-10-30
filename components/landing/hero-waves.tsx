"use client";

import { useAnimationFrame, useReducedMotion, useSpring } from "motion/react";
import { useEffect, useRef, useState } from "react";

const WAVE_START_X = -60;
const WAVE_WIDTH = 520;

/** A plain sine polyline. The path is drawn well past both edges of the
 * visible band so neither the CSS drift fallback nor the parallax below
 * ever reveals empty space. */
function buildWavePath(
  baseline: number,
  amplitude: number,
  periods: number,
  phase: number,
  points = 56,
): string {
  const segments: string[] = [];
  for (let i = 0; i <= points; i++) {
    const x = WAVE_START_X + (i / points) * WAVE_WIDTH;
    const theta = (i / points) * periods * 2 * Math.PI + phase;
    const y = baseline + amplitude * Math.sin(theta);
    segments.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return segments.join(" ");
}

function waveY(baseline: number, amplitude: number, periods: number, phase: number, x: number) {
  const theta = ((x - WAVE_START_X) / WAVE_WIDTH) * periods * 2 * Math.PI + phase;
  return baseline + amplitude * Math.sin(theta);
}

// Wave A ("Person A") and Wave B ("Person B") — deliberately different
// amplitude/frequency/phase so the two are visually distinct even under
// prefers-reduced-motion, where these static shapes are all that's shown.
const WAVE_A_BASELINE = 200;
const WAVE_A_AMPLITUDE = 26;
const WAVE_A_PERIODS = 2.6;
const WAVE_A_PHASE = 0;

const WAVE_B_BASELINE = 200;
const WAVE_B_AMPLITUDE = 20;
const WAVE_B_PERIODS = 3.1;
const WAVE_B_PHASE = Math.PI / 2.5;

const wavePathA = buildWavePath(WAVE_A_BASELINE, WAVE_A_AMPLITUDE, WAVE_A_PERIODS, WAVE_A_PHASE);
const wavePathB = buildWavePath(WAVE_B_BASELINE, WAVE_B_AMPLITUDE, WAVE_B_PERIODS, WAVE_B_PHASE);

const DOT_A_X = 130;
const DOT_A_Y = waveY(WAVE_A_BASELINE, WAVE_A_AMPLITUDE, WAVE_A_PERIODS, WAVE_A_PHASE, DOT_A_X);
const DOT_B_X = 300;
const DOT_B_Y = waveY(WAVE_B_BASELINE, WAVE_B_AMPLITUDE, WAVE_B_PERIODS, WAVE_B_PHASE, DOT_B_X);

// Live motion tuning. Each wave travels at its own tempo and breathes its
// amplitude on its own slow cycle, so their relative phase keeps evolving
// (sometimes in step, sometimes not) without ever being scripted. Every
// oscillation starts at zero so the first animated frame is exactly the
// server-rendered shape above.
const TAU = Math.PI * 2;
const WAVE_A_TRAVEL = TAU / 9000; // radians per ms
const WAVE_B_TRAVEL = TAU / 11500;
const WAVE_A_BREATH = { depth: 0.1, period: 13000 };
const WAVE_B_BREATH = { depth: 0.12, period: 17000 };

// Sync glow: same opacity/scale range as the original CSS pulse
// (hero-sync-pulse, 0.15→0.4 and 0.85→1.1), but driven by how closely the
// two waves actually line up across the middle of the illustration.
const GLOW_MIN_OPACITY = 0.15;
const GLOW_MAX_OPACITY = 0.4;
const GLOW_MIN_SCALE = 0.85;
const GLOW_MAX_SCALE = 1.1;
const ALIGN_SAMPLES = Array.from({ length: 12 }, (_, i) => 90 + i * 20);

// Pointer parallax, in CSS px for the HTML layers and SVG user units for
// the layers inside the illustration. Deeper layers move against the
// pointer, nearer ones with it; all of it is a few pixels at most.
const DEPTH = {
  wash: { x: -14, y: -10 },
  ambientGlow: { x: 10, y: 8 },
  illustration: { x: 6, y: 4 },
  waveA: { x: -3, y: -2 },
  waveB: { x: 4, y: 3 },
  specks: { x: 10, y: 7 },
} as const;

const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

/** Wraps an angle difference into [-π, π] so easing one phase onto
 * another always takes the short way round. */
function wrapAngle(angle: number) {
  return ((((angle + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
}

/**
 * The hero's two-wave illustration (decorative, aria-hidden by its parent
 * `.landing-hero__illustration`). It server-renders exactly the original
 * static artwork; on the client, unless the visitor prefers reduced
 * motion, it brings that same artwork to life:
 *
 * - The waves ripple (their phase travels) instead of sliding sideways
 *   as rigid shapes, and each participant dot stays at its x position,
 *   riding its own wave up and down.
 * - The central glow responds to the waves' real alignment, rather than
 *   pulsing on a fixed timer.
 * - Hovering or focusing the hero's "Let's play" link eases Wave B into
 *   Wave A's rhythm (same amplitude, frequency and phase), so the two
 *   dots end up on one shared wave and the glow blooms; leaving releases
 *   them back to their own rhythms.
 * - With a fine pointer, the ambient wash, the glow layer, the
 *   illustration and each wave shift a few pixels at different depths.
 *
 * Until hydration (and if JavaScript never runs) the original CSS drift
 * and glow pulse in app/globals.css keep animating; the `--live` class
 * hands both over to this component. The entrance (waves drawing in,
 * dots appearing) is pure CSS, keyed off the `pathLength` and dot-group
 * markup below. All writes happen in Motion's frame loop, straight to the
 * DOM, so nothing here re-renders React per frame, and the loop idles
 * while the hero is off screen.
 */
export function HeroWaves() {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathARef = useRef<SVGPathElement>(null);
  const pathBRef = useRef<SVGPathElement>(null);
  const dotARingRef = useRef<SVGCircleElement>(null);
  const dotACoreRef = useRef<SVGCircleElement>(null);
  const dotBRingRef = useRef<SVGCircleElement>(null);
  const dotBCoreRef = useRef<SVGCircleElement>(null);
  const waveARef = useRef<SVGGElement>(null);
  const waveBRef = useRef<SVGGElement>(null);
  const specksRef = useRef<SVGGElement>(null);
  const glowRef = useRef<SVGCircleElement>(null);
  const layers = useRef<{
    wash: HTMLElement | null;
    ambientGlow: HTMLElement | null;
    illustration: HTMLElement | null;
  }>({ wash: null, ambientGlow: null, illustration: null });
  const loop = useRef({ elapsed: 0, onScreen: true, glow: 0 });

  const reduceMotion = useReducedMotion();
  const [live, setLive] = useState(false);

  const sync = useSpring(0, { stiffness: 45, damping: 15 });
  const pointerX = useSpring(0, { stiffness: 70, damping: 20 });
  const pointerY = useSpring(0, { stiffness: 70, damping: 20 });

  useEffect(() => {
    const svg = svgRef.current;
    const hero = svg?.closest<HTMLElement>(".landing-hero");
    if (!svg || !hero || reduceMotion !== false) return;

    layers.current = {
      wash: hero.querySelector(".landing-hero__ambient-wash"),
      ambientGlow: hero.querySelector(".landing-hero__ambient-glow"),
      illustration: hero.querySelector(".landing-hero__illustration"),
    };
    setLive(true);

    const visibility = new IntersectionObserver(([entry]) => {
      loop.current.onScreen = entry?.isIntersecting ?? true;
    });
    visibility.observe(svg);

    const cta = hero.querySelector<HTMLElement>(".landing-button--hero");
    const toSync = () => sync.set(1);
    const toOwnRhythm = () => sync.set(0);
    cta?.addEventListener("pointerenter", toSync);
    cta?.addEventListener("pointerleave", toOwnRhythm);
    cta?.addEventListener("focus", toSync);
    cta?.addEventListener("blur", toOwnRhythm);

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const onPointerMove = (event: PointerEvent) => {
      const bounds = hero.getBoundingClientRect();
      pointerX.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1);
      pointerY.set(((event.clientY - bounds.top) / bounds.height) * 2 - 1);
    };
    const onPointerLeave = () => {
      pointerX.set(0);
      pointerY.set(0);
    };
    if (finePointer) {
      hero.addEventListener("pointermove", onPointerMove);
      hero.addEventListener("pointerleave", onPointerLeave);
    }

    const pathA = pathARef.current;
    const pathB = pathBRef.current;
    const dotsA = [dotARingRef.current, dotACoreRef.current];
    const dotsB = [dotBRingRef.current, dotBCoreRef.current];
    const waveA = waveARef.current;
    const waveB = waveBRef.current;
    const specks = specksRef.current;
    const glow = glowRef.current;
    const { wash, ambientGlow, illustration } = layers.current;

    return () => {
      visibility.disconnect();
      cta?.removeEventListener("pointerenter", toSync);
      cta?.removeEventListener("pointerleave", toOwnRhythm);
      cta?.removeEventListener("focus", toSync);
      cta?.removeEventListener("blur", toOwnRhythm);
      hero.removeEventListener("pointermove", onPointerMove);
      hero.removeEventListener("pointerleave", onPointerLeave);
      // Back to the exact static artwork (e.g. if reduced motion is
      // switched on mid-visit).
      setLive(false);
      loop.current = { elapsed: 0, onScreen: true, glow: 0 };
      sync.jump(0);
      pointerX.jump(0);
      pointerY.jump(0);
      pathA?.setAttribute("d", wavePathA);
      pathB?.setAttribute("d", wavePathB);
      dotsA.forEach((dot) => dot?.setAttribute("cy", String(DOT_A_Y)));
      dotsB.forEach((dot) => dot?.setAttribute("cy", String(DOT_B_Y)));
      for (const el of [waveA, waveB, specks, glow]) {
        el?.style.removeProperty("transform");
        el?.style.removeProperty("opacity");
      }
      for (const el of [wash, ambientGlow, illustration]) el?.style.removeProperty("translate");
    };
  }, [reduceMotion, sync, pointerX, pointerY]);

  useAnimationFrame((_, delta) => {
    const state = loop.current;
    if (!live) return;
    // Idle while the hero is off screen, but let a sync or parallax spring
    // that's still settling finish first, so scrolling back never shows a
    // jump from a stale frame.
    const settling = sync.isAnimating() || pointerX.isAnimating() || pointerY.isAnimating();
    if (!state.onScreen && !settling) return;
    // Cap the step so returning to a background tab doesn't lurch.
    const step = Math.min(delta, 50);
    state.elapsed += step;
    const t = state.elapsed;
    const s = sync.get();

    const ampA =
      WAVE_A_AMPLITUDE * (1 + WAVE_A_BREATH.depth * Math.sin((t / WAVE_A_BREATH.period) * TAU));
    const phaseA = WAVE_A_PHASE - t * WAVE_A_TRAVEL;
    const ownAmpB =
      WAVE_B_AMPLITUDE * (1 + WAVE_B_BREATH.depth * Math.sin((t / WAVE_B_BREATH.period) * TAU));
    const ownPhaseB = WAVE_B_PHASE - t * WAVE_B_TRAVEL;

    const ampB = lerp(ownAmpB, ampA, s);
    const periodsB = lerp(WAVE_B_PERIODS, WAVE_A_PERIODS, s);
    const phaseB = phaseA + wrapAngle(ownPhaseB - phaseA) * (1 - s);

    pathARef.current?.setAttribute(
      "d",
      buildWavePath(WAVE_A_BASELINE, ampA, WAVE_A_PERIODS, phaseA),
    );
    pathBRef.current?.setAttribute("d", buildWavePath(WAVE_B_BASELINE, ampB, periodsB, phaseB));

    const dotAY = waveY(WAVE_A_BASELINE, ampA, WAVE_A_PERIODS, phaseA, DOT_A_X).toFixed(2);
    const dotBY = waveY(WAVE_B_BASELINE, ampB, periodsB, phaseB, DOT_B_X).toFixed(2);
    dotARingRef.current?.setAttribute("cy", dotAY);
    dotACoreRef.current?.setAttribute("cy", dotAY);
    dotBRingRef.current?.setAttribute("cy", dotBY);
    dotBCoreRef.current?.setAttribute("cy", dotBY);

    // Alignment: mean vertical gap between the waves across the middle of
    // the band, relative to their combined height, eased so the glow
    // swells and fades rather than flickering.
    let gap = 0;
    for (const x of ALIGN_SAMPLES) {
      gap += Math.abs(
        waveY(WAVE_A_BASELINE, ampA, WAVE_A_PERIODS, phaseA, x) -
          waveY(WAVE_B_BASELINE, ampB, periodsB, phaseB, x),
      );
    }
    const alignment = Math.max(0, 1 - gap / ALIGN_SAMPLES.length / ((ampA + ampB) * 0.5));
    state.glow = lerp(state.glow, alignment * alignment, 1 - Math.exp(-step / 450));
    const glow = glowRef.current;
    if (glow) {
      glow.style.opacity = lerp(GLOW_MIN_OPACITY, GLOW_MAX_OPACITY, state.glow).toFixed(3);
      glow.style.transform = `scale(${lerp(GLOW_MIN_SCALE, GLOW_MAX_SCALE, state.glow).toFixed(3)})`;
    }

    const px = pointerX.get();
    const py = pointerY.get();
    const { wash, ambientGlow, illustration } = layers.current;
    if (wash) wash.style.translate = `${px * DEPTH.wash.x}px ${py * DEPTH.wash.y}px`;
    if (ambientGlow) {
      ambientGlow.style.translate = `${px * DEPTH.ambientGlow.x}px ${py * DEPTH.ambientGlow.y}px`;
    }
    if (illustration) {
      illustration.style.translate = `${px * DEPTH.illustration.x}px ${py * DEPTH.illustration.y}px`;
    }
    for (const [el, depth] of [
      [waveARef.current, DEPTH.waveA],
      [waveBRef.current, DEPTH.waveB],
      [specksRef.current, DEPTH.specks],
    ] as const) {
      if (el) el.style.transform = `translate(${px * depth.x}px, ${py * depth.y}px)`;
    }
  });

  return (
    <svg
      ref={svgRef}
      className={`hero-shape__svg${live ? " hero-shape__svg--live" : ""}`}
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <defs>
        <linearGradient id="heroWaveGradientA" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--wl-lavender)" />
          <stop offset="100%" stopColor="var(--wl-pink)" />
        </linearGradient>
        <linearGradient id="heroWaveGradientB" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--wl-blue)" />
          <stop offset="100%" stopColor="var(--wl-mint)" />
        </linearGradient>
      </defs>

      {/* a handful of scattered dots, kept clear of the two waves as light
          peripheral texture — not competing with them. Framed in a loose
          diamond around the wave band (two upper, two lower, alternating
          left/right). Grouped only so they can share one parallax depth. */}
      <g ref={specksRef} className="hero-shape__specks">
        <circle cx="18" cy="150" r="5" fill="var(--wl-lavender)" />
        <circle cx="368" cy="182" r="6" fill="var(--wl-peach)" />
        <circle cx="352" cy="255" r="5" fill="var(--wl-lavender)" />
        <circle cx="80" cy="250" r="5" fill="var(--wl-pink)" />
      </g>

      {/* the "moment of alignment" — a soft glow at the illustration's
          center that swells when the two waves fall into step */}
      <circle
        ref={glowRef}
        className="hero-sync-glow"
        cx="200"
        cy="200"
        r="60"
        fill="var(--wl-mint)"
      />

      {/* Wave A — "Person A"'s own rhythm */}
      <g ref={waveARef} className="hero-wave hero-wave--a">
        <path
          ref={pathARef}
          className="hero-wave__path"
          d={wavePathA}
          pathLength={1}
          stroke="url(#heroWaveGradientA)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />
        <g className="hero-wave__dot">
          <circle
            ref={dotARingRef}
            cx={DOT_A_X}
            cy={DOT_A_Y}
            r="11"
            fill="#ffffff"
            stroke="var(--wl-lavender)"
            strokeWidth="4"
          />
          <circle ref={dotACoreRef} cx={DOT_A_X} cy={DOT_A_Y} r="4" fill="var(--wl-ink)" />
        </g>
      </g>

      {/* Wave B — "Person B"'s own, slightly different rhythm */}
      <g ref={waveBRef} className="hero-wave hero-wave--b">
        <path
          ref={pathBRef}
          className="hero-wave__path"
          d={wavePathB}
          pathLength={1}
          stroke="url(#heroWaveGradientB)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />
        <g className="hero-wave__dot">
          <circle
            ref={dotBRingRef}
            cx={DOT_B_X}
            cy={DOT_B_Y}
            r="11"
            fill="#ffffff"
            stroke="var(--wl-blue)"
            strokeWidth="4"
          />
          <circle ref={dotBCoreRef} cx={DOT_B_X} cy={DOT_B_Y} r="4" fill="var(--wl-ink)" />
        </g>
      </g>
    </svg>
  );
}
