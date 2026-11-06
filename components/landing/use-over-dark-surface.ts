"use client";

import { useEffect, useState, type RefObject } from "react";

/** Marks a full-width section with a dark background (e.g. the closing
 * "See how much you're on the same page." panel). A see-through header
 * passing over one switches to its light tone. */
export const DARK_SURFACE_ATTRIBUTE = "data-surface";
const DARK_SURFACE_SELECTOR = `[${DARK_SURFACE_ATTRIBUTE}="dark"]`;

function isSeeThrough(element: HTMLElement): boolean {
  const background = getComputedStyle(element).backgroundColor;
  if (background === "transparent") return true;
  // Computed colors come back as "rgb(r, g, b)" (opaque) or
  // "rgba(r, g, b, a)"; only the latter carries an alpha.
  const alpha = background.match(/^rgba\((?:[^,]+,){3}\s*([\d.]+)\s*\)$/)?.[1];
  return alpha !== undefined && Number(alpha) < 0.5;
}

/**
 * True while a dark surface sits behind the vertical centre of `ref`'s
 * element — the line the header's wordmark, nav and CTA all sit on.
 *
 * Only see-through headers are tracked. Every internal page's header
 * paints its own white background, so its ink wordmark is always on
 * white and this hook never flips it. Today that leaves the home page's
 * fixed, transparent header, which floats over the dark closing CTA.
 *
 * One IntersectionObserver whose root margin shrinks the viewport to a
 * 1px band at the header's centre line: a dark surface "intersects" only
 * while it covers that line. No scroll listener, no layout reads while
 * scrolling. The band is rebuilt on resize, since the header's offset and
 * the viewport height both change there.
 *
 * Starts `false` on the server and on first client render (the header
 * always loads over the light hero), so hydration never mismatches; the
 * observer's first callback corrects it right away if the page was
 * reloaded mid-scroll.
 */
export function useOverDarkSurface(ref: RefObject<HTMLElement | null>): boolean {
  const [overDark, setOverDark] = useState(false);

  useEffect(() => {
    const header = ref.current;
    if (!header || typeof IntersectionObserver === "undefined") return;
    if (!isSeeThrough(header)) return;

    const surfaces = document.querySelectorAll(DARK_SURFACE_SELECTOR);
    if (surfaces.length === 0) return;

    const covering = new Set<Element>();
    let observer: IntersectionObserver | null = null;

    const observe = () => {
      observer?.disconnect();
      covering.clear();
      const { top, height } = header.getBoundingClientRect();
      const line = Math.max(0, Math.round(top + height / 2));
      const below = Math.max(0, window.innerHeight - line - 1);
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) covering.add(entry.target);
            else covering.delete(entry.target);
          }
          setOverDark(covering.size > 0);
        },
        { rootMargin: `-${line}px 0px -${below}px 0px` },
      );
      surfaces.forEach((surface) => observer!.observe(surface));
    };

    observe();
    window.addEventListener("resize", observe);
    return () => {
      window.removeEventListener("resize", observe);
      observer?.disconnect();
    };
  }, [ref]);

  return overDark;
}
