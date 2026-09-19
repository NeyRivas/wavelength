"use client";

import { useCallback, useEffect, useState } from "react";

import styles from "./result-cards-prototype.module.css";

// Isolated visual prototype for the "Wavelength Result Cards" social-share
// concept (Instagram Stories first, 9:16). Fake demo data only — not wired
// to any real wavelength, Server Action, Share, or Download flow. Nothing
// here is imported by any other route.

const NAMES = "NEY + LUCAS";
const SCORE = "75%";

const GRADIENT_PRESETS = [
  { name: "Lavender → Blue", c1: "#C9C3F4", c2: "#B9DDF4" },
  { name: "Blue → Mint", c1: "#B9DDF4", c2: "#C5E8DD" },
  { name: "Pink → Peach", c1: "#F3C7DD", c2: "#F7D0B5" },
  { name: "Lavender → Pink", c1: "#C9C3F4", c2: "#F3C7DD" },
  { name: "Mint → Blue", c1: "#C5E8DD", c2: "#B9DDF4" },
  { name: "Peach → Pink", c1: "#F7D0B5", c2: "#F3C7DD" },
] as const;

const CARD_COUNT = 4;

function BrandMark() {
  return (
    <svg className={styles.brandMark} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" stroke="#181820" strokeWidth="2" />
      <circle cx="10" cy="10" r="2.5" fill="#181820" />
    </svg>
  );
}

function SyncedWave({ width = 170, height = 68 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 200 80" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="protoWaveA" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#C9C3F4" />
          <stop offset="100%" stopColor="#F3C7DD" />
        </linearGradient>
        <linearGradient id="protoWaveB" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#B9DDF4" />
          <stop offset="100%" stopColor="#C5E8DD" />
        </linearGradient>
      </defs>
      <path
        d="M14 40c30-22 56-22 86 0s56 22 86 0"
        stroke="url(#protoWaveA)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M14 42c30-19 56-19 86 0s56 19 86 0"
        stroke="url(#protoWaveB)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.85"
      />
      <circle cx="14" cy="41" r="7" fill="#fff" stroke="#C9C3F4" strokeWidth="3" />
      <circle cx="14" cy="41" r="2.5" fill="#181820" />
      <circle cx="186" cy="41" r="7" fill="#fff" stroke="#B9DDF4" strokeWidth="3" />
      <circle cx="186" cy="41" r="2.5" fill="#181820" />
    </svg>
  );
}

function OffsetWave({ width = 150, height = 60 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 200 80" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="protoOffsetA" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#F7D0B5" />
          <stop offset="100%" stopColor="#F3C7DD" />
        </linearGradient>
        <linearGradient id="protoOffsetB" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#B9DDF4" />
          <stop offset="100%" stopColor="#C5E8DD" />
        </linearGradient>
      </defs>
      <path
        d="M14 30c30-26 56-26 86 0s56 26 86 0"
        stroke="url(#protoOffsetA)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M14 52c30 20 56 20 86 0s56-20 86 0"
        stroke="url(#protoOffsetB)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}

// Pastel palette, one color per dot — growing in size left to right, like a
// small cluster of light bubbles rather than a plain web progress bar.
const DOT_COLORS = ["#C9C3F4", "#B9DDF4", "#F3C7DD", "#F7D0B5"];
const DOT_SIZES = [6, 8, 10, 12];

function ProgressDots({ current }: { current: number }) {
  return (
    <div className={styles.dots} role="img" aria-label={`Card ${current + 1} of ${CARD_COUNT}`}>
      {Array.from({ length: CARD_COUNT }, (_, i) => (
        <span
          key={i}
          className={[styles.dot, i === current ? styles.dotCurrent : ""].filter(Boolean).join(" ")}
          style={{
            width: DOT_SIZES[i],
            height: DOT_SIZES[i],
            background: DOT_COLORS[i],
            opacity: i <= current ? 1 : 0.3,
          }}
        />
      ))}
    </div>
  );
}

function CardOne() {
  return (
    <div className={styles.content}>
      <div className={styles.eyebrow}>Your wavelength</div>
      <div className={styles.names}>{NAMES}</div>
      <div className={styles.score}>{SCORE}</div>
      <div className={styles.caption}>On the same wavelength</div>
      <div className={styles.waveLarge}>
        <SyncedWave width={200} height={80} />
      </div>
    </div>
  );
}

function CardTwo() {
  return (
    <div className={styles.content}>
      <div className={styles.eyebrow}>You really clicked</div>
      <div className={styles.spotlight}>
        <span className={styles.spotlightWord}>Lifestyle</span>
        <span className={styles.spotlightWord}>Future</span>
      </div>
      <p className={styles.line}>Some things you just don&rsquo;t have to talk about.</p>
      <div className={styles.wave}>
        <SyncedWave width={150} height={60} />
      </div>
    </div>
  );
}

function CardThree() {
  return (
    <div className={styles.content}>
      <div className={styles.eyebrow}>Different wavelengths</div>
      <div className={styles.diffHeadline}>Different tempos, same song.</div>
      <div className={styles.chipRow}>
        <div className={styles.chip}>
          <span className={styles.chipDot} style={{ background: "#F7D0B5" }} />
          Money
        </div>
        <div className={styles.chip}>
          <span className={styles.chipDot} style={{ background: "#F3C7DD" }} />
          Relationship
        </div>
        <div className={styles.chip}>
          <span className={styles.chipDot} style={{ background: "#B9DDF4" }} />
          Adventures &amp; Travel
        </div>
      </div>
      <div className={styles.wave}>
        <OffsetWave />
      </div>
    </div>
  );
}

function CardFour() {
  return (
    <div className={styles.content}>
      <div className={styles.shareWordmark}>Wavelength</div>
      <div className={styles.names}>{NAMES}</div>
      <div className={[styles.score, styles.scoreSmall].join(" ")}>{SCORE}</div>
      <div className={styles.caption}>On the same wavelength</div>
      <div className={styles.waveLarge}>
        <SyncedWave width={220} height={88} />
      </div>
      <div className={styles.shareBadge}>wavelength.zone</div>
    </div>
  );
}

const CARDS = [CardOne, CardTwo, CardThree, CardFour];

export function ResultCardsPrototype() {
  const [index, setIndex] = useState(0);
  const [presetIndex, setPresetIndex] = useState(0);

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(CARD_COUNT - 1, i + 1));
  }, []);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev]);

  const preset = GRADIENT_PRESETS[presetIndex] ?? GRADIENT_PRESETS[0];
  const CurrentCard = CARDS[index] ?? CardOne;

  return (
    <div className={styles.root}>
      <p className={styles.label}>
        Wavelength Result Cards — prototype ({index + 1}/{CARD_COUNT})
      </p>

      <div
        className={styles.phone}
        style={{ ["--c1" as string]: preset.c1, ["--c2" as string]: preset.c2 }}
      >
        <div className={styles.bg} />
        <div className={styles.grain} />

        <div className={styles.frame}>
          <div className={styles.card}>
            <div className={styles.top}>
              <div className={styles.brand}>
                <BrandMark />
                Wavelength
              </div>
              <ProgressDots current={index} />
            </div>

            <CurrentCard />
          </div>
        </div>

        <button
          type="button"
          className={`${styles.tapZone} ${styles.tapZonePrev}`}
          onClick={goPrev}
          disabled={index === 0}
        >
          <span className={styles.srOnly}>Previous card</span>
        </button>
        <button
          type="button"
          className={`${styles.tapZone} ${styles.tapZoneNext}`}
          onClick={goNext}
          disabled={index === CARD_COUNT - 1}
        >
          <span className={styles.srOnly}>Next card</span>
        </button>
      </div>

      <div className={styles.arrows}>
        <button
          type="button"
          className={styles.arrowButton}
          onClick={goPrev}
          disabled={index === 0}
          aria-label="Previous card"
        >
          ←
        </button>
        <button
          type="button"
          className={styles.arrowButton}
          onClick={goNext}
          disabled={index === CARD_COUNT - 1}
          aria-label="Next card"
        >
          →
        </button>
      </div>

      <p className={styles.label}>Gradient preset (controlled set, not random yet)</p>
      <div className={styles.presetRow}>
        {GRADIENT_PRESETS.map((p, i) => (
          <button
            key={p.name}
            type="button"
            aria-label={p.name}
            title={p.name}
            className={[
              styles.presetSwatch,
              i === presetIndex ? styles.presetSwatchActive : "",
            ].join(" ")}
            style={{ background: `linear-gradient(135deg, ${p.c1}, ${p.c2})` }}
            onClick={() => setPresetIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}
