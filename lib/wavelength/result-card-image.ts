/**
 * Turns the currently-selected Result Card into a downloadable/shareable
 * PNG, faithful to the approved design (components/result/cards/
 * result-cards.module.css + result-card-content.tsx): same 9:16
 * proportion, typography, colors, gradients, glass panel, and wavelength
 * motifs, for the real names/score/categories of this result.
 *
 * Technique: draw directly onto a <canvas> with the Canvas 2D API
 * (gradients, rounded rects, bezier paths for the wave motifs, tracked
 * text), rather than rasterizing an <svg><foreignObject> snapshot of the
 * live DOM. The foreignObject route was tried first and works for on-
 * screen preview, but Chromium (and other engines) treat a canvas that
 * has ever had foreignObject/HTML content drawn into it as "tainted" —
 * `canvas.toBlob()`/`toDataURL()` then throw `SecurityError: Tainted
 * canvases may not be exported`, even for entirely same-origin, self-
 * generated markup. That's a hard platform restriction, not something
 * fixable by escaping more characters, so export draws everything as
 * plain shapes/gradients/text instead — nothing here is a rasterized DOM
 * snapshot.
 *
 * One deliberate difference from the on-screen card: the glass panel's
 * `backdrop-filter` blur is approximated with a flat, similarly-toned
 * translucent fill (a canvas has no equivalent of "blur what's already
 * been painted underneath" outside of manually blurring the background
 * bitmap, which isn't worth the complexity here) — since the panel always
 * sits on a smooth gradient with no fine detail, this reads as visually
 * equivalent. Nothing else about the glass panel changes.
 *
 * Also deliberately omitted from the exported image: the progress dots.
 * They're in-app navigation chrome, not part of the card's own content —
 * the same way Instagram's own Stories progress bar never ends up baked
 * into a re-shared screenshot — and aren't listed among what the
 * downloaded image must preserve.
 */

import type { ResultCardsData } from "./result-cards";

const DESIGN_W = 405;
const DESIGN_H = 720;
const EXPORT_W = 1080;
const SCALE = EXPORT_W / DESIGN_W;
const EXPORT_H = Math.round(DESIGN_H * SCALE);

export const CARD_SLUGS = [
  "your-wavelength",
  "you-really-clicked",
  "different-wavelengths",
  "share-your-wavelength",
] as const;

// ---------- color helpers ----------

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.substring(0, 2), 16),
    parseInt(clean.substring(2, 4), 16),
    parseInt(clean.substring(4, 6), 16),
  ];
}

/** Approximates CSS `color-mix(in srgb, hexA pct%, hexB)`. */
function mix(hexA: string, pct: number, hexB: string): string {
  const [ar, ag, ab] = hexToRgb(hexA);
  const [br, bg, bb] = hexToRgb(hexB);
  const t = pct / 100;
  const r = Math.round(ar * t + br * (1 - t));
  const g = Math.round(ag * t + bg * (1 - t));
  const b = Math.round(ab * t + bb * (1 - t));
  return `rgb(${r}, ${g}, ${b})`;
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ---------- shape helpers ----------

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Manual letter-spacing — reliable across browsers, unlike the
 * still-inconsistently-supported `CanvasRenderingContext2D.letterSpacing`. */
function trackedWidth(ctx: CanvasRenderingContext2D, text: string, spacing: number): number {
  let width = 0;
  for (const ch of text) width += ctx.measureText(ch).width + spacing;
  return width > 0 ? width - spacing : 0;
}

function fillTrackedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
) {
  // Every caller here draws one card in an ambient ctx.textAlign =
  // "center" (for the plain, untracked fillText calls elsewhere in that
  // same card). This function's own cursor math assumes left-alignment —
  // each glyph's left edge at `cursor` — so it must force that
  // regardless of the ambient value, then restore it, or a "center"
  // alignment would draw each character centered *on* `cursor` instead,
  // scrambling the spacing (most visible on wide glyphs like "W").
  const previousAlign = ctx.textAlign;
  ctx.textAlign = "left";
  let cursor = x;
  for (const ch of text) {
    ctx.fillText(ch, cursor, y);
    cursor += ctx.measureText(ch).width + spacing;
  }
  ctx.textAlign = previousAlign;
}

function fillTrackedTextCentered(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  spacing: number,
) {
  const width = trackedWidth(ctx, text, spacing);
  fillTrackedText(ctx, text, centerX - width / 2, y, spacing);
}

// ---------- wave motifs (bezier equivalents of wave-motifs.tsx's paths) ----------

function drawEndDot(ctx: CanvasRenderingContext2D, x: number, y: number, ringColor: string) {
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = ringColor;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = "#181820";
  ctx.fill();
}

/** viewBox is always 200×80 (2.5:1) for every wave size the design uses
 * (200×80, 150×60, 220×88, 170×68) — so a single uniform scale factor
 * (`w / 200`) always applies without distortion. */
function drawSyncedWave(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  w: number,
  h: number,
) {
  const factor = w / 200;
  ctx.save();
  ctx.translate(centerX - w / 2, centerY - h / 2);
  ctx.scale(factor, factor);
  ctx.lineCap = "round";

  const gradA = ctx.createLinearGradient(14, 0, 186, 0);
  gradA.addColorStop(0, "#C9C3F4");
  gradA.addColorStop(1, "#F3C7DD");
  ctx.lineWidth = 3;
  ctx.strokeStyle = gradA;
  ctx.beginPath();
  ctx.moveTo(14, 40);
  ctx.bezierCurveTo(44, 18, 70, 18, 100, 40);
  ctx.bezierCurveTo(130, 62, 156, 62, 186, 40);
  ctx.stroke();

  const gradB = ctx.createLinearGradient(14, 0, 186, 0);
  gradB.addColorStop(0, "#B9DDF4");
  gradB.addColorStop(1, "#C5E8DD");
  ctx.globalAlpha = 0.85;
  ctx.strokeStyle = gradB;
  ctx.beginPath();
  ctx.moveTo(14, 42);
  ctx.bezierCurveTo(44, 23, 70, 23, 100, 42);
  ctx.bezierCurveTo(130, 61, 156, 61, 186, 42);
  ctx.stroke();
  ctx.globalAlpha = 1;

  drawEndDot(ctx, 14, 41, "#C9C3F4");
  drawEndDot(ctx, 186, 41, "#B9DDF4");
  ctx.restore();
}

function drawOffsetWave(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  w: number,
  h: number,
) {
  const factor = w / 200;
  ctx.save();
  ctx.translate(centerX - w / 2, centerY - h / 2);
  ctx.scale(factor, factor);
  ctx.lineCap = "round";

  const gradA = ctx.createLinearGradient(14, 0, 186, 0);
  gradA.addColorStop(0, "#F7D0B5");
  gradA.addColorStop(1, "#F3C7DD");
  ctx.lineWidth = 3;
  ctx.strokeStyle = gradA;
  ctx.beginPath();
  ctx.moveTo(14, 30);
  ctx.bezierCurveTo(44, 4, 70, 4, 100, 30);
  ctx.bezierCurveTo(130, 56, 156, 56, 186, 30);
  ctx.stroke();

  const gradB = ctx.createLinearGradient(14, 0, 186, 0);
  gradB.addColorStop(0, "#B9DDF4");
  gradB.addColorStop(1, "#C5E8DD");
  ctx.globalAlpha = 0.85;
  ctx.strokeStyle = gradB;
  ctx.beginPath();
  ctx.moveTo(14, 52);
  ctx.bezierCurveTo(44, 72, 70, 72, 100, 52);
  ctx.bezierCurveTo(130, 32, 156, 32, 186, 52);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ---------- layout ----------

interface LayoutItem {
  height: number;
  gapBefore: number;
  draw: (topY: number) => void;
}

/** Approximates flexbox `justify-content: center` over a fixed-height
 * column of items with per-item top margins, matching result-cards.module
 * .css's `.content{gap:10px}` (applied between every consecutive pair)
 * plus whichever item-specific `margin-top` result-card-content.tsx adds
 * on top of that shared gap. */
function layoutCentered(items: LayoutItem[], boxTop: number, boxBottom: number) {
  const totalGap = items.reduce((sum, item, i) => sum + (i > 0 ? item.gapBefore : 0), 0);
  const totalHeight = items.reduce((sum, item) => sum + item.height, 0) + totalGap;
  let y = boxTop + (boxBottom - boxTop - totalHeight) / 2;
  items.forEach((item, i) => {
    if (i > 0) y += item.gapBefore;
    item.draw(y);
    y += item.height;
  });
}

const CARD_X = 26;
const CARD_Y = 56;
const CARD_W = DESIGN_W - CARD_X * 2;
const CARD_H = DESIGN_H - CARD_Y * 2;
const CARD_CENTER_X = CARD_X + CARD_W / 2;
const CONTENT_TOP = CARD_Y + 92;
const CONTENT_BOTTOM = CARD_Y + CARD_H - 34;

const INK = "#181820";
const MUTED = "#5c6773";
const CHIP_COLORS = ["#F7D0B5", "#F3C7DD", "#B9DDF4", "#C5E8DD", "#C9C3F4"];

function namesLine(aliasA: string, aliasB: string): string {
  return `${aliasA.toUpperCase()} + ${aliasB.toUpperCase()}`;
}

function drawChrome(
  ctx: CanvasRenderingContext2D,
  data: ResultCardsData,
  fonts: { fraunces: string; nunito: string },
) {
  // background — CSS layers paint first-listed on top; canvas draws
  // bottom-to-top, so the order below is deliberately reversed from
  // result-cards.module.css's `.bg` declaration.
  ctx.fillStyle = mix(data.gradient.c1, 38, "#ffffff");
  ctx.fillRect(0, 0, DESIGN_W, DESIGN_H / 2);
  const base = ctx.createLinearGradient(0, 0, 0, DESIGN_H);
  base.addColorStop(0, mix(data.gradient.c1, 38, "#ffffff"));
  base.addColorStop(0.52, "#ffffff");
  base.addColorStop(1, mix(data.gradient.c2, 38, "#ffffff"));
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);

  const radial2 = ctx.createRadialGradient(
    DESIGN_W * 0.92,
    DESIGN_H * 0.96,
    0,
    DESIGN_W * 0.92,
    DESIGN_H * 0.96,
    DESIGN_W * 0.95,
  );
  radial2.addColorStop(0, rgba(data.gradient.c2, 0.6));
  radial2.addColorStop(1, rgba(data.gradient.c2, 0));
  ctx.fillStyle = radial2;
  ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);

  const radial1 = ctx.createRadialGradient(
    DESIGN_W * 0.12,
    DESIGN_H * 0.04,
    0,
    DESIGN_W * 0.12,
    DESIGN_H * 0.04,
    DESIGN_W * 0.95,
  );
  radial1.addColorStop(0, rgba(data.gradient.c1, 0.65));
  radial1.addColorStop(1, rgba(data.gradient.c1, 0));
  ctx.fillStyle = radial1;
  ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);

  // grain — a small tile of random noise, blended with "overlay" the same
  // way the on-screen version uses mix-blend-mode: overlay. An
  // approximation of the SVG feTurbulence filter, not a pixel match.
  const tile = document.createElement("canvas");
  tile.width = 64;
  tile.height = 64;
  const tileCtx = tile.getContext("2d");
  if (tileCtx) {
    const imageData = tileCtx.createImageData(64, 64);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const v = Math.floor(Math.random() * 255);
      imageData.data[i] = v;
      imageData.data[i + 1] = v;
      imageData.data[i + 2] = v;
      imageData.data[i + 3] = 255;
    }
    tileCtx.putImageData(imageData, 0, 0);
    const pattern = ctx.createPattern(tile, "repeat");
    if (pattern) {
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.globalCompositeOperation = "overlay";
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);
      ctx.restore();
    }
  }

  // glass card
  ctx.save();
  ctx.shadowColor = "rgba(24, 24, 32, 0.3)";
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 24;
  roundRectPath(ctx, CARD_X, CARD_Y, CARD_W, CARD_H, 28);
  ctx.fillStyle = "rgba(255, 255, 255, 0.42)";
  ctx.fill();
  ctx.restore();

  roundRectPath(ctx, CARD_X, CARD_Y, CARD_W, CARD_H, 28);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
  ctx.stroke();

  // top row — brand mark + wordmark (no progress dots, see file doc comment)
  const iconCx = CARD_X + 18 + 6.5;
  const iconCy = CARD_Y + 18 + 9;
  ctx.beginPath();
  ctx.arc(iconCx, iconCy, 4.9, 0, Math.PI * 2);
  ctx.lineWidth = 1.3;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(iconCx, iconCy, 1.6, 0, Math.PI * 2);
  ctx.fillStyle = INK;
  ctx.fill();

  ctx.font = `800 10px ${fonts.nunito}`;
  ctx.fillStyle = MUTED;
  ctx.textBaseline = "middle";
  fillTrackedText(ctx, "WAVELENGTH", iconCx + 12, iconCy, 1.3);
}

function drawCardOne(
  ctx: CanvasRenderingContext2D,
  data: ResultCardsData,
  fonts: { fraunces: string; nunito: string },
) {
  ctx.textAlign = "center";
  layoutCentered(
    [
      {
        height: 14,
        gapBefore: 0,
        draw: (y) => {
          ctx.font = `800 11px ${fonts.nunito}`;
          ctx.fillStyle = MUTED;
          ctx.textBaseline = "top";
          fillTrackedTextCentered(ctx, "YOUR WAVELENGTH", CARD_CENTER_X, y, 1.5);
        },
      },
      {
        height: 16,
        gapBefore: 16,
        draw: (y) => {
          ctx.font = `800 13px ${fonts.nunito}`;
          ctx.fillStyle = INK;
          ctx.textBaseline = "top";
          fillTrackedTextCentered(ctx, namesLine(data.aliasA, data.aliasB), CARD_CENTER_X, y, 1);
        },
      },
      {
        height: 88,
        gapBefore: 12,
        draw: (y) => {
          ctx.font = `italic 600 88px ${fonts.fraunces}`;
          ctx.fillStyle = INK;
          ctx.textBaseline = "top";
          ctx.fillText(`${data.score}%`, CARD_CENTER_X, y - 12);
        },
      },
      {
        height: 16,
        gapBefore: 10,
        draw: (y) => {
          ctx.font = `800 13px ${fonts.nunito}`;
          ctx.fillStyle = MUTED;
          ctx.textBaseline = "top";
          fillTrackedTextCentered(ctx, "ON THE SAME WAVELENGTH", CARD_CENTER_X, y, 1.4);
        },
      },
      {
        height: 80,
        gapBefore: 30,
        draw: (y) => drawSyncedWave(ctx, CARD_CENTER_X, y + 40, 200, 80),
      },
    ],
    CONTENT_TOP,
    CONTENT_BOTTOM,
  );
}

function drawCardTwo(
  ctx: CanvasRenderingContext2D,
  data: ResultCardsData,
  fonts: { fraunces: string; nunito: string },
) {
  ctx.textAlign = "center";
  const words = data.alignedCategories;
  const wordHeight = 44;
  layoutCentered(
    [
      {
        height: 14,
        gapBefore: 0,
        draw: (y) => {
          ctx.font = `800 11px ${fonts.nunito}`;
          ctx.fillStyle = MUTED;
          ctx.textBaseline = "top";
          fillTrackedTextCentered(ctx, "YOU REALLY CLICKED", CARD_CENTER_X, y, 1.5);
        },
      },
      {
        height: words.length * wordHeight,
        gapBefore: 14,
        draw: (y) => {
          ctx.font = `italic 600 38px ${fonts.fraunces}`;
          ctx.fillStyle = INK;
          ctx.textBaseline = "top";
          words.forEach((word, i) => {
            ctx.fillText(word, CARD_CENTER_X, y + i * wordHeight);
          });
        },
      },
      {
        height: 44,
        gapBefore: 26,
        draw: (y) => {
          ctx.font = `italic 500 16px ${fonts.fraunces}`;
          ctx.fillStyle = MUTED;
          ctx.textBaseline = "top";
          wrapText(
            ctx,
            "Some things you just don’t have to talk about.",
            CARD_CENTER_X,
            y,
            230,
            22,
          );
        },
      },
      {
        height: 60,
        gapBefore: 24,
        draw: (y) => drawSyncedWave(ctx, CARD_CENTER_X, y + 30, 150, 60),
      },
    ],
    CONTENT_TOP,
    CONTENT_BOTTOM,
  );
}

function drawChipRow(
  ctx: CanvasRenderingContext2D,
  labels: string[],
  fonts: { fraunces: string; nunito: string },
  topY: number,
): number {
  const chipHeight = 40;
  const gap = 8;
  const chipX = CARD_X + 24;
  const chipW = CARD_W - 48;
  let y = topY;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  for (const label of labels) {
    roundRectPath(ctx, chipX, y, chipW, chipHeight, 14);
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
    ctx.stroke();

    const dotX = chipX + 16;
    const dotY = y + chipHeight / 2;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
    ctx.fillStyle = CHIP_COLORS[labels.indexOf(label) % CHIP_COLORS.length]!;
    ctx.fill();

    ctx.font = `800 14px ${fonts.nunito}`;
    ctx.fillStyle = INK;
    ctx.fillText(label, dotX + 14, dotY + 1);

    y += chipHeight + gap;
  }
  ctx.textAlign = "center";
  return y - gap;
}

function drawCardThree(
  ctx: CanvasRenderingContext2D,
  data: ResultCardsData,
  fonts: { fraunces: string; nunito: string },
) {
  ctx.textAlign = "center";
  const hasDifferences = data.differentCategories.length > 0;

  if (hasDifferences) {
    const chipsHeight =
      data.differentCategories.length * 40 + (data.differentCategories.length - 1) * 8;
    layoutCentered(
      [
        {
          height: 14,
          gapBefore: 0,
          draw: (y) => {
            ctx.font = `800 11px ${fonts.nunito}`;
            ctx.fillStyle = MUTED;
            ctx.textBaseline = "top";
            fillTrackedTextCentered(ctx, "DIFFERENT WAVELENGTHS", CARD_CENTER_X, y, 1.5);
          },
        },
        {
          height: 63,
          gapBefore: 14,
          draw: (y) => {
            ctx.font = `italic 600 26px ${fonts.fraunces}`;
            ctx.fillStyle = INK;
            ctx.textBaseline = "top";
            wrapText(ctx, "Different tempos, same song.", CARD_CENTER_X, y, 220, 30);
          },
        },
        {
          height: chipsHeight,
          gapBefore: 28,
          draw: (y) => drawChipRow(ctx, data.differentCategories, fonts, y),
        },
        {
          height: 60,
          gapBefore: 24,
          draw: (y) => drawOffsetWave(ctx, CARD_CENTER_X, y + 30, 150, 60),
        },
      ],
      CONTENT_TOP,
      CONTENT_BOTTOM,
    );
    return;
  }

  layoutCentered(
    [
      {
        height: 14,
        gapBefore: 0,
        draw: (y) => {
          ctx.font = `800 11px ${fonts.nunito}`;
          ctx.fillStyle = MUTED;
          ctx.textBaseline = "top";
          fillTrackedTextCentered(ctx, "DIFFERENT WAVELENGTHS", CARD_CENTER_X, y, 1.5);
        },
      },
      {
        height: 33,
        gapBefore: 14,
        draw: (y) => {
          ctx.font = `italic 600 26px ${fonts.fraunces}`;
          ctx.fillStyle = INK;
          ctx.textBaseline = "top";
          ctx.fillText("Aligned across the board.", CARD_CENTER_X, y);
        },
      },
      {
        height: 22,
        gapBefore: 26,
        draw: (y) => {
          ctx.font = `italic 500 16px ${fonts.fraunces}`;
          ctx.fillStyle = MUTED;
          ctx.textBaseline = "top";
          ctx.fillText("You matched on every category this time.", CARD_CENTER_X, y);
        },
      },
      {
        height: 60,
        gapBefore: 24,
        draw: (y) => drawSyncedWave(ctx, CARD_CENTER_X, y + 30, 150, 60),
      },
    ],
    CONTENT_TOP,
    CONTENT_BOTTOM,
  );
}

function drawCardFour(
  ctx: CanvasRenderingContext2D,
  data: ResultCardsData,
  fonts: { fraunces: string; nunito: string },
) {
  ctx.textAlign = "center";
  layoutCentered(
    [
      {
        height: 15,
        gapBefore: 0,
        draw: (y) => {
          ctx.font = `800 15px ${fonts.nunito}`;
          ctx.fillStyle = INK;
          ctx.textBaseline = "top";
          fillTrackedTextCentered(ctx, "WAVELENGTH", CARD_CENTER_X, y, 3);
        },
      },
      {
        height: 16,
        gapBefore: 12,
        draw: (y) => {
          ctx.font = `800 13px ${fonts.nunito}`;
          ctx.fillStyle = INK;
          ctx.textBaseline = "top";
          fillTrackedTextCentered(ctx, namesLine(data.aliasA, data.aliasB), CARD_CENTER_X, y, 1);
        },
      },
      {
        height: 64,
        gapBefore: 12,
        draw: (y) => {
          ctx.font = `italic 600 64px ${fonts.fraunces}`;
          ctx.fillStyle = INK;
          ctx.textBaseline = "top";
          ctx.fillText(`${data.score}%`, CARD_CENTER_X, y - 8);
        },
      },
      {
        height: 16,
        gapBefore: 10,
        draw: (y) => {
          ctx.font = `800 13px ${fonts.nunito}`;
          ctx.fillStyle = MUTED;
          ctx.textBaseline = "top";
          fillTrackedTextCentered(ctx, "ON THE SAME WAVELENGTH", CARD_CENTER_X, y, 1.4);
        },
      },
      {
        height: 88,
        gapBefore: 30,
        draw: (y) => drawSyncedWave(ctx, CARD_CENTER_X, y + 44, 220, 88),
      },
      {
        height: 36,
        gapBefore: 36,
        draw: (y) => {
          const label = "wavelength.zone";
          ctx.font = `700 12px ${fonts.nunito}`;
          const textWidth = ctx.measureText(label).width;
          const padX = 18;
          const boxW = textWidth + padX * 2;
          roundRectPath(ctx, CARD_CENTER_X - boxW / 2, y, boxW, 36, 18);
          ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
          ctx.fill();
          ctx.lineWidth = 1;
          ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
          ctx.stroke();
          ctx.fillStyle = MUTED;
          ctx.textBaseline = "middle";
          ctx.fillText(label, CARD_CENTER_X, y + 18);
          ctx.textBaseline = "top";
        },
      },
    ],
    CONTENT_TOP,
    CONTENT_BOTTOM,
  );
}

/** Minimal word-wrap for the two italic one-liners that can exceed one
 * line at this font size — centers each resulting line. */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  topY: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  lines.forEach((line, i) => ctx.fillText(line, centerX, topY + i * lineHeight));
}

const CARD_DRAWERS = [drawCardOne, drawCardTwo, drawCardThree, drawCardFour];

/**
 * Renders card `cardIndex` (0-3) of `data` to a PNG Blob at Instagram-
 * Stories-grade resolution (1080×1920). Browser-only — throws if called
 * during SSR.
 */
export async function renderResultCardPng(
  data: ResultCardsData,
  cardIndex: number,
  rawFonts: { fraunces: string; nunito: string },
): Promise<Blob> {
  if (typeof document === "undefined") {
    throw new Error("renderResultCardPng can only run in the browser");
  }

  // Defensive only: the card currently on screen already renders in these
  // exact font families, so they're already loaded by this point — this
  // just guards against a caller invoking export before the first paint.
  await document.fonts.ready;

  const canvas = document.createElement("canvas");
  canvas.width = EXPORT_W;
  canvas.height = EXPORT_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  ctx.scale(SCALE, SCALE);
  drawChrome(ctx, data, rawFonts);
  const draw = CARD_DRAWERS[cardIndex] ?? CARD_DRAWERS[0]!;
  draw(ctx, data, rawFonts);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Failed to encode the result card as PNG");
  return blob;
}

export function resultCardFileName(data: ResultCardsData, cardIndex: number): string {
  const slug = CARD_SLUGS[cardIndex] ?? CARD_SLUGS[0];
  const names = `${data.aliasA}-${data.aliasB}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `wavelength-${names}-${slug}.png`;
}
