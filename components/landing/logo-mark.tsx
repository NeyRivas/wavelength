import { useId } from "react";

/** The ring-and-dot icon next to the "Sameeeish" wordmark in the header,
 * footer, and create-header (Figma reference, screenshot 1 & 4) — a plain
 * inline SVG, no icon library. Refinement pass: same two shapes as before,
 * three changes. (1) The ring's flat `--wl-lavender` stroke becomes a
 * lavender-to-blue gradient at the same 135° angle as the site's own
 * `--vivid-a` card gradient (globals.css) — it now carries both brand
 * hues instead of inventing a new color. (2) The center dot grows from
 * r=3.25 to r=3.75 (and the ring stroke from 2 to 2.25) for better optical
 * balance at favicon scale, where the old dot nearly disappeared. (3) A
 * second, larger ring behind the fixed one expands and fades on a slow
 * loop (.logo-mark__ping, globals.css) — a soft "signal" pulse, off
 * entirely under prefers-reduced-motion. `useId()` keeps the gradient's
 * `id` unique per instance, since the header and footer (and
 * create-header) can all render this mark on the same page at once.
 * `currentColor` on the dot still matches the surrounding text color. */
export function LogoMark({ className }: { className?: string }) {
  const gradientId = useId();

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--wl-lavender)" />
          <stop offset="100%" stopColor="var(--wl-blue)" />
        </linearGradient>
      </defs>
      <circle
        className="logo-mark__ping"
        cx="12"
        cy="12"
        r="9"
        stroke={`url(#${gradientId})`}
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="9" stroke={`url(#${gradientId})`} strokeWidth="2.25" />
      <circle cx="12" cy="12" r="3.75" fill="currentColor" />
    </svg>
  );
}
