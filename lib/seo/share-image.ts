import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Shared by app/opengraph-image.tsx (light) and app/twitter-image.tsx
// (dark) — the one site-wide share image for every route that doesn't
// define its own (none currently do). Both images use the same two
// brand typefaces and the same ring-and-dot mark as the rest of the
// site (components/landing/logo-mark.tsx, app/globals.css's --wl-*
// tokens), so a link preview looks like it belongs to Sameeeish rather
// than a generic template.

export const SHARE_IMAGE_SIZE = { width: 1200, height: 630 } as const;

export const BRAND = {
  ink: "#181820",
  lavender: "#c9c3f4",
  blue: "#b9ddf4",
  pink: "#f3c7dd",
  peach: "#f7d0b5",
  mint: "#c5e8dd",
} as const;

/** A gradient stop's "fade to transparent" has to be transparent *in
 * that same hue* (`rgba(r,g,b,0)`), not the literal `transparent`
 * keyword (`rgba(0,0,0,0)`) — Satori/resvg interpolates through that
 * stop's actual color, so fading to black-with-zero-alpha visibly muddies
 * the middle of the gradient into gray instead of a clean fade. Also used
 * at alpha > 0 in place of a div-level `opacity`, for the same reason. */
export function rgba(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

async function readFont(fileName: string) {
  return readFile(join(process.cwd(), "assets/fonts", fileName));
}

/** `next/og`'s ImageResponse (Satori) only supports ttf/otf/woff font
 * data, not the woff2 next/font/google serves to the browser — so these
 * are separate, vendored copies of the same two families (assets/fonts),
 * fetched once from Google Fonts and read here rather than re-fetched on
 * every image render. See that directory's own note for provenance.
 *
 * Each image loads only the weights it actually renders (500KB bundle
 * budget per next/og route — see its own docs) — the two share Fraunces
 * italic 500 and Nunito Sans 600, but the brand-name label is Nunito Sans
 * 800 on the light image and 700 on the dark one. */
export async function loadLightShareImageFonts() {
  const [frauncesItalic, nunitoSemibold, nunitoExtrabold] = await Promise.all([
    readFont("Fraunces-Italic-500.ttf"),
    readFont("NunitoSans-600.ttf"),
    readFont("NunitoSans-800.ttf"),
  ]);

  return [
    { name: "Fraunces", data: frauncesItalic, style: "italic" as const, weight: 500 as const },
    { name: "Nunito Sans", data: nunitoSemibold, style: "normal" as const, weight: 600 as const },
    { name: "Nunito Sans", data: nunitoExtrabold, style: "normal" as const, weight: 800 as const },
  ];
}

export async function loadDarkShareImageFonts() {
  const [frauncesItalic, nunitoSemibold, nunitoBold] = await Promise.all([
    readFont("Fraunces-Italic-500.ttf"),
    readFont("NunitoSans-600.ttf"),
    readFont("NunitoSans-700.ttf"),
  ]);

  return [
    { name: "Fraunces", data: frauncesItalic, style: "italic" as const, weight: 500 as const },
    { name: "Nunito Sans", data: nunitoSemibold, style: "normal" as const, weight: 600 as const },
    { name: "Nunito Sans", data: nunitoBold, style: "normal" as const, weight: 700 as const },
  ];
}

/** The header/footer ring-and-dot mark, standalone rather than via
 * `currentColor` (components/landing/logo-mark.tsx) — this renders as a
 * detached raster image, not inline text, so it needs its own explicit
 * dot color for the light vs. dark background it sits on. */
export function logoMarkDataUri(dotColor: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${BRAND.lavender}"/><stop offset="100%" stop-color="${BRAND.blue}"/></linearGradient></defs><circle cx="12" cy="12" r="9" stroke="url(#g)" stroke-width="2.25"/><circle cx="12" cy="12" r="3.75" fill="${dotColor}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** A single, full-canvas fractal-noise field (not a tiled background —
 * Satori's CSS support doesn't reliably cover `background-repeat`) laid
 * over the gradient at low opacity, so the field reads as a soft, grainy
 * surface instead of a flat printer-vector gradient. */
export function grainDataUri(width: number, height: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
