"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { renderResultCardPng, resultCardFileName } from "@/lib/wavelength/result-card-image";
import type { ResultCardsData } from "@/lib/wavelength/result-cards";

import { ProgressDots, CARD_COUNT } from "./progress-dots";
import { RESULT_CARDS } from "./result-card-content";
import styles from "./result-cards.module.css";
import { BrandMark } from "./wave-motifs";

/**
 * The approved Result Cards experience (Results → Share), opened as a
 * full-screen overlay on top of the Result page rather than a separate
 * route — same 4-card sequence, same phone frame/glass card/gradient/dots
 * as the approved app/proto-result-cards prototype, now fed real data and
 * with working Download/Share actions the prototype never had.
 */
export function ResultCardsExperience({
  data,
  shareText,
  onClose,
}: {
  data: ResultCardsData;
  shareText: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const hintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev, onClose]);

  // Lock background scroll while the overlay is open — this fully covers
  // the viewport, so the Result page underneath shouldn't also scroll.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    };
  }, []);

  function showHint(message: string) {
    setHint(message);
    if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    hintTimeoutRef.current = setTimeout(() => setHint(null), 2500);
  }

  function resolveFonts(): { fraunces: string; nunito: string } {
    const el = overlayRef.current;
    const computed = el ? getComputedStyle(el) : null;
    const fraunces = computed?.getPropertyValue("--font-fraunces").trim();
    const nunito = computed?.getPropertyValue("--font-nunito").trim();
    return {
      fraunces: fraunces || "serif",
      nunito: nunito || "system-ui, sans-serif",
    };
  }

  async function handleDownload() {
    setIsBusy(true);
    try {
      const blob = await renderResultCardPng(data, index, resolveFonts());
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = resultCardFileName(data, index);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showHint("Saved!");
    } catch {
      showHint("Couldn't save the image — try again.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleShare() {
    setIsBusy(true);
    try {
      const blob = await renderResultCardPng(data, index, resolveFonts());
      const file = new File([blob], resultCardFileName(data, index), { type: "image/png" });

      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "Wavelength", text: shareText });
          setIsBusy(false);
          return;
        } catch {
          // User dismissed the native share sheet, or it otherwise failed —
          // fall through to the download fallback below instead of erroring.
        }
      }

      // No file-sharing Web Share support (most desktops) — save the image
      // instead, so it's ready to upload to Instagram/TikTok/etc manually.
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = resultCardFileName(data, index);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showHint("Saved — you can upload it to Instagram, TikTok, or anywhere else.");
    } catch {
      showHint("Couldn't prepare the image — try again.");
    } finally {
      setIsBusy(false);
    }
  }

  const CurrentCard = RESULT_CARDS[index] ?? RESULT_CARDS[0]!;

  return (
    <div
      className={styles.overlay}
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Wavelength result cards"
    >
      <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
        ×
      </button>

      <div
        className={styles.phone}
        style={{ ["--c1" as string]: data.gradient.c1, ["--c2" as string]: data.gradient.c2 }}
      >
        <div className={styles.bg} />
        <div className={styles.grain} />

        <div className={styles.frame}>
          <div className={styles.card}>
            <div className={styles.top}>
              <div className={styles.brand}>
                <BrandMark className={styles.brandMark} />
                Wavelength
              </div>
              <ProgressDots current={index} />
            </div>

            <CurrentCard data={data} />
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

      <div className={styles.actionsRow}>
        <button
          type="button"
          className={styles.actionButton}
          onClick={handleDownload}
          disabled={isBusy}
        >
          Download
        </button>
        <button
          type="button"
          className={styles.actionButton}
          onClick={handleShare}
          disabled={isBusy}
        >
          Share
        </button>
      </div>
      <p className={styles.actionHint} role="status">
        {hint ?? ""}
      </p>
    </div>
  );
}
