import Link from "next/link";

/**
 * The "already taken" state (app/w/[token]/page.tsx's `preview.is_taken`
 * branch) — shown to someone who is not (yet) a participant on a token
 * whose Wavelength already has both A and B. Purely a visual redesign of
 * what used to be a single bare, unstyled `<main><h1>/<p></main>` — the
 * guard that decides *when* this renders (`get_wavelength_preview`'s
 * `is_taken` flag) lives entirely in the page component and is completely
 * untouched, as is the copy.
 *
 * Motif: the same "two ringed, solid dots" language as B's "Nice try!"
 * screen (.b-locked) — both dots really are filled here too, since this
 * Wavelength genuinely already has two participants — plus one small,
 * purely decorative variation: a faint hollow dot at the midpoint with a
 * soft strike-through, reading as "no third spot" without any new copy or
 * logic, just this screen's own spin on the shared motif.
 *
 * Action: reuses the same plain `<Link href="/create">` pattern
 * ResultNotAvailableNotice uses (not CreateNewWavelengthAction's confirm
 * dialog) — this viewer is a non-participant with no session or result at
 * stake here, so a "you may lose access to this completed result" warning
 * would be both untrue and confusing. Same destination, same underlying
 * navigation, nothing new invented.
 */
export function WavelengthInProgressNotice() {
  return (
    <div className="wavelength-in-progress">
      <div className="wavelength-in-progress__ambient" aria-hidden="true">
        <div className="wavelength-in-progress__ambient-blob wavelength-in-progress__ambient-blob--a" />
        <div className="wavelength-in-progress__ambient-blob wavelength-in-progress__ambient-blob--b" />
      </div>

      <svg
        className="wavelength-in-progress__motif"
        viewBox="0 0 260 56"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="wavelengthInProgressGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--wl-peach)" />
            <stop offset="100%" stopColor="var(--wl-pink)" />
          </linearGradient>
        </defs>
        <path
          className="wl-connector"
          d="M18 36c40-28 80-28 112 0s72 28 112 0"
          stroke="url(#wavelengthInProgressGradient)"
          strokeWidth="1.5"
          strokeDasharray="5 6"
        />
        <circle cx="18" cy="36" r="9" fill="#ffffff" stroke="var(--wl-peach)" strokeWidth="4" />
        <circle cx="18" cy="36" r="3.5" fill="var(--wl-ink)" />
        <circle cx="242" cy="36" r="9" fill="#ffffff" stroke="var(--wl-pink)" strokeWidth="4" />
        <circle cx="242" cy="36" r="3.5" fill="var(--wl-ink)" />
        {/* "No third spot" — a small hollow, faded dot with a soft
            strike-through, sitting exactly on the same curve at its
            midpoint. Purely decorative; the two solid dots above already
            carry the real meaning ("two participants are here"). */}
        <circle
          cx="130"
          cy="36"
          r="6"
          fill="none"
          stroke="var(--wl-muted)"
          strokeWidth="1.5"
          opacity="0.5"
        />
        <line
          x1="126"
          y1="32"
          x2="134"
          y2="40"
          stroke="var(--wl-muted)"
          strokeWidth="1.5"
          opacity="0.5"
        />
      </svg>

      <h1 className="wavelength-in-progress__heading">This Wavelength is already in progress</h1>
      <p className="wavelength-in-progress__text">It already has two participants.</p>

      <Link href="/create" className="wavelength-in-progress__button">
        Create your own Wavelength
      </Link>
    </div>
  );
}
