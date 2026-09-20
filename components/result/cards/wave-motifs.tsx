/**
 * The two-wavelength motifs, ported verbatim (same paths/colors/strokes)
 * from the approved app/proto-result-cards prototype — visual design is
 * frozen, only the source location moved so the real Result Cards
 * experience can import it. `SyncedWave` (both waves in phase — cards 1, 2,
 * 4) and `OffsetWave` (out of phase — card 3, "different wavelengths")
 * intentionally reuse the same two SVG shapes the prototype used to
 * distinguish "aligned" from "different" without any negative framing.
 */

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" stroke="#181820" strokeWidth="2" />
      <circle cx="10" cy="10" r="2.5" fill="#181820" />
    </svg>
  );
}

export function SyncedWave({ width = 170, height = 68 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 200 80" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="wlCardWaveA" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#C9C3F4" />
          <stop offset="100%" stopColor="#F3C7DD" />
        </linearGradient>
        <linearGradient id="wlCardWaveB" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#B9DDF4" />
          <stop offset="100%" stopColor="#C5E8DD" />
        </linearGradient>
      </defs>
      <path
        d="M14 40c30-22 56-22 86 0s56 22 86 0"
        stroke="url(#wlCardWaveA)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M14 42c30-19 56-19 86 0s56 19 86 0"
        stroke="url(#wlCardWaveB)"
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

export function OffsetWave({ width = 150, height = 60 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 200 80" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="wlCardOffsetA" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#F7D0B5" />
          <stop offset="100%" stopColor="#F3C7DD" />
        </linearGradient>
        <linearGradient id="wlCardOffsetB" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#B9DDF4" />
          <stop offset="100%" stopColor="#C5E8DD" />
        </linearGradient>
      </defs>
      <path
        d="M14 30c30-26 56-26 86 0s56 26 86 0"
        stroke="url(#wlCardOffsetA)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M14 52c30 20 56 20 86 0s56-20 86 0"
        stroke="url(#wlCardOffsetB)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}
