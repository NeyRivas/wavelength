/** The small ring-and-dot icon next to the "Wavelength" wordmark in the
 * header and footer (Figma reference, screenshot 1 & 4) — a plain inline
 * SVG, no icon library. `currentColor` for the center dot so it always
 * matches the surrounding text color (dark ink in the header/footer,
 * white in the dark CTA section if ever reused there). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="var(--wl-lavender)" strokeWidth="2" />
      <circle cx="12" cy="12" r="3.25" fill="currentColor" />
    </svg>
  );
}
