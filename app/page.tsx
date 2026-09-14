import { Fraunces, Nunito_Sans } from "next/font/google";
import Link from "next/link";

// Landing page only (app/page.tsx / route "/"). Everything below is
// presentation for this one route — no new functionality, no routing,
// Supabase, or business-logic changes. The actual entry point into the
// product is still the same plain `<Link href="/create">` it always was;
// this only changes how that content is framed visually.
//
// Fonts are instantiated here, not in the root layout, and their CSS
// variables are applied only to this page's own wrapper div (`fraunces
// .variable`/`nunitoSans.variable` below) — every other route keeps
// inheriting globals.css's existing system-ui stack untouched.
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["400", "500", "600"],
  variable: "--font-fraunces",
  display: "swap",
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

/**
 * Small, reusable decorative shapes (visual v2 — "elementos visuales
 * decorativos"). Plain inline SVG, each `aria-hidden` and styled only via
 * the shared `.landing-deco` class + a per-instance placement class (see
 * globals.css) — `currentColor` so each instance's tint/opacity/glow is
 * driven entirely by CSS, nothing hardcoded here. None of these render
 * outside this page.
 */
function Sparkle({ className }: { className: string }) {
  return (
    <svg className={`landing-deco ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
      />
    </svg>
  );
}

function RingShape({ className }: { className: string }) {
  return (
    <svg className={`landing-deco ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function WaveShape({ className }: { className: string }) {
  return (
    <svg className={`landing-deco ${className}`} viewBox="0 0 48 16" aria-hidden="true">
      <path
        d="M0 8c4-6 8-6 12 0s8 6 12 0 8-6 12 0 8 6 12 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Exactly one instance is rendered — "puede existir algún corazón de
 * manera MUY puntual" (product decision: at most one, never a motif). */
function HeartShape({ className }: { className: string }) {
  return (
    <svg className={`landing-deco ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 4.595a5.9 5.9 0 0 0-3.996-1.558 5.942 5.942 0 0 0-4.213 1.758c-2.353 2.353-2.352 6.14.002 8.492l7.332 7.332a1.25 1.25 0 0 0 1.75 0l7.332-7.332c2.354-2.352 2.355-6.139.002-8.492a5.942 5.942 0 0 0-4.213-1.758A5.9 5.9 0 0 0 12 4.595Z"
      />
    </svg>
  );
}

/**
 * Visual structure (product decision — brand landing v2):
 *
 *   [ ad slot ]   [ centered content column ]   [ ad slot ]
 *                  ...atmospheric multi-tone gradient + a dozen
 *                  small, scattered, mostly-white decorative shapes...
 *   [ ──────────── giant "WAVELENGTH" wordmark, pinned to the very
 *                   bottom of the document ──────────── ]
 *
 * The two ad slots are empty, unstyled reserved space (explicitly no fake
 * ads/banners yet) — see .landing-ad in globals.css. Every decorative
 * element (.landing-gradient, .landing-blob-*, .landing-deco-*) is
 * `aria-hidden` and `pointer-events: none`; none of it carries content, so
 * it changes nothing for a screen reader or for keyboard navigation.
 */
export default function HomePage() {
  return (
    <div className={`${fraunces.variable} ${nunitoSans.variable} landing`}>
      <div className="landing-gradient" aria-hidden="true" />

      {/* Soft organic "light bloom" shapes — see globals.css for why these
          use a whisper of cream rather than literal white (invisible on
          the equally-white page). */}
      <div className="landing-blob landing-blob--1" aria-hidden="true" />
      <div className="landing-blob landing-blob--2" aria-hidden="true" />
      <div className="landing-blob landing-blob--3" aria-hidden="true" />

      {/* Small scattered abstract shapes — a mix of sparkles, rings, waves
          and one single heart, spread across the whole composition
          (including far from the gradient) rather than clustered around
          the center. Never forms a central illustration. */}
      <Sparkle className="landing-deco--1" />
      <Sparkle className="landing-deco--2" />
      <RingShape className="landing-deco--3" />
      <RingShape className="landing-deco--4" />
      <WaveShape className="landing-deco--5" />
      <WaveShape className="landing-deco--6" />
      <Sparkle className="landing-deco--7" />
      <HeartShape className="landing-deco--8" />
      <Sparkle className="landing-deco--9" />

      <div className="landing-grid">
        {/* Reserved for a future ad placement — deliberately empty. */}
        <div className="landing-ad landing-ad--left" aria-hidden="true" />

        <main className="landing-content">
          <h1 className="landing-brand">Wavelength</h1>
          <p className="landing-description">
            Are we on the same wavelength? Create a set of questions and find out together.
          </p>
          <Link href="/create" className="landing-cta">
            Create your Wavelength
          </Link>
        </main>

        {/* Reserved for a future ad placement — deliberately empty. */}
        <div className="landing-ad landing-ad--right" aria-hidden="true" />
      </div>

      <div className="landing-footer">
        <p className="landing-wordmark" aria-hidden="true">
          Wavelength
        </p>
      </div>
    </div>
  );
}
