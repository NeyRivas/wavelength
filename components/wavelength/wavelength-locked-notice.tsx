import { CreateNewWavelengthAction } from "@/components/wavelength/create-new-wavelength-action";

/**
 * B's "no going back" screen (app/w/[token]/answer/page.tsx) — shown only
 * when B, already COMPLETED, tries to reload or revisit /answer. Purely a
 * visual redesign of what used to be a single bare, unstyled
 * `<main><h1>/<p>/<a></main>` with no classes at all — the guard that
 * decides *when* this renders lives entirely in the page component and is
 * completely untouched, as is the copy and the two actions' behavior.
 *
 * Reuses the same "two ringed dots + a gradient connector" language as
 * ReviewIntro/InviteIntro/the result transition (.wl-connector, app/
 * globals.css) — here both dots are solid/filled, unlike those screens'
 * one-hollow-and-waiting dot, since by the time this can ever show, both A
 * and B have already finished.
 */
export function WavelengthLockedNotice({ shareToken }: { shareToken: string }) {
  return (
    <div className="b-locked">
      <div className="b-locked__ambient" aria-hidden="true">
        <div className="b-locked__ambient-blob b-locked__ambient-blob--a" />
        <div className="b-locked__ambient-blob b-locked__ambient-blob--b" />
      </div>

      <svg className="b-locked__motif" viewBox="0 0 260 56" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="bLockedConnectorGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--wl-lavender)" />
            <stop offset="100%" stopColor="var(--wl-blue)" />
          </linearGradient>
        </defs>
        <path
          className="wl-connector"
          d="M18 36c40-28 80-28 112 0s72 28 112 0"
          stroke="url(#bLockedConnectorGradient)"
          strokeWidth="1.5"
          strokeDasharray="5 6"
        />
        <circle cx="18" cy="36" r="9" fill="#ffffff" stroke="var(--wl-lavender)" strokeWidth="4" />
        <circle cx="18" cy="36" r="3.5" fill="var(--wl-ink)" />
        <circle cx="242" cy="36" r="9" fill="#ffffff" stroke="var(--wl-blue)" strokeWidth="4" />
        <circle cx="242" cy="36" r="3.5" fill="var(--wl-ink)" />
      </svg>

      <h1 className="b-locked__heading">Nice try! 😄</h1>
      <p className="b-locked__text">
        You&apos;ve already answered this Wavelength — no going back and changing your mind now,
        that&apos;s not really the same wavelength anymore.
      </p>

      <div className="b-locked__actions">
        <a href={`/w/${shareToken}/result`} className="b-locked__button b-locked__button--primary">
          See your result
        </a>
        <div className="b-locked__secondary">
          <CreateNewWavelengthAction />
        </div>
      </div>
    </div>
  );
}
