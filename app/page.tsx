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
  weight: ["400", "600", "700"],
  variable: "--font-nunito",
  display: "swap",
});

/**
 * Visual structure (product decision — brand landing v1):
 *
 *   [ ad slot ]   [ centered content column ]   [ ad slot ]
 *                  ...atmospheric gradient + scattered
 *                  soft-white decoration behind it...
 *   [ ──────────── giant "Wavelength" wordmark ──────────── ]
 *
 * The two ad slots are empty, unstyled reserved space (explicitly no fake
 * ads/banners yet) — see .landing-ad in globals.css. Every decorative
 * element (.landing-gradient, .landing-blob-*) is `aria-hidden` and
 * `pointer-events: none`; none of it carries content, so it changes
 * nothing for a screen reader or for keyboard navigation.
 */
export default function HomePage() {
  return (
    <div className={`${fraunces.variable} ${nunitoSans.variable} landing`}>
      <div className="landing-gradient" aria-hidden="true" />
      <div className="landing-blob landing-blob--1" aria-hidden="true" />
      <div className="landing-blob landing-blob--2" aria-hidden="true" />
      <div className="landing-blob landing-blob--3" aria-hidden="true" />
      <div className="landing-blob landing-blob--4" aria-hidden="true" />
      <div className="landing-blob landing-blob--5" aria-hidden="true" />

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
