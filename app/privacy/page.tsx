import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";

import { BackLink } from "@/components/landing/back-link";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";

// /privacy — describes what Sameeeish actually does with data today,
// based on reading the real implementation (anonymous Supabase Auth,
// the wavelengths/questions/answers tables and their row-level security,
// Vercel as the host that serves every request (confirmed by the project
// owner: sameeeish.com is a domain of the Vercel project; it isn't recorded
// in this repo),
// Google Analytics on public pages only (components/analytics/
// google-analytics.tsx + lib/analytics/ga-privacy-guard.ts), and the
// absence of any deletion flow) —
// not a generic template. Same pattern as every other marketing route
// (own font instantiation, shared LandingHeader/LandingFooter,
// .landing--internal wrapper, BackLink). No new functionality, routing,
// Supabase, or business-logic changes.
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["400", "500", "600"],
  variable: "--font-fraunces",
  display: "swap",
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

const PAGE_DESCRIPTION = "What Sameeeish actually stores, and who can see it.";

export const metadata: Metadata = {
  title: "Privacy Policy — Sameeeish",
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy — Sameeeish",
    description: PAGE_DESCRIPTION,
    url: "/privacy",
    siteName: "Sameeeish",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Privacy Policy — Sameeeish",
    description: PAGE_DESCRIPTION,
  },
};

export default function PrivacyPage() {
  return (
    <div className={`${fraunces.variable} ${nunitoSans.variable} landing landing--internal`}>
      <LandingHeader />
      <main>
        <BackLink href="/" />
        <section className="landing-section landing-how landing-legal">
          <h1 className="landing-section__heading">Privacy Policy</h1>
          <p className="landing-legal__updated">
            This page describes how Sameeeish actually works today. We&apos;ll update it if that
            changes, rather than leaving it to describe an older version of the app.
          </p>
          <div className="landing-legal__body">
            <h2>No accounts, no sign-up</h2>
            <p>
              Sameeeish doesn&apos;t ask for an email address or a password, and there&apos;s no
              account to create. When you open the app, it automatically starts an anonymous session
              through Supabase, the service that runs Sameeeish&apos;s backend — this lets the app
              recognize &quot;you&quot; as you create and answer questionnaires.
            </p>
            <p>
              To finish creating a Wavelength, or to join one, you do type a name (up to 60
              characters). It doesn&apos;t have to be your real name — a nickname works — and
              it&apos;s stored with that Wavelength and shown to the other participant.
            </p>

            <h2>What we store</h2>
            <p>
              Sameeeish&apos;s only job is to run a small shared questionnaire — a
              &quot;Wavelength&quot; — between two people. To do that, we store the questions in a
              Wavelength you create (including any display name or alias you choose to go by in it),
              the answers both participants submit, and timestamps for when it was created, shared,
              answered, and completed.
            </p>
            <p>
              Your Wavelengths, questions, and answers don&apos;t include your IP address or device
              information. Supabase, which runs the anonymous sign-in, and Vercel, which hosts the
              website (see &quot;Third-party services&quot; below), may record technical connection
              details such as IP address and browser type as part of providing their services.
              Sameeeish&apos;s own code doesn&apos;t include advertising scripts.
            </p>

            <h2>Analytics</h2>
            <p>
              We use Google Analytics to understand how many people visit Sameeeish&apos;s public
              pages (like the home page, the game pages, and the FAQ), which of those pages they
              view, and how they found us. Google Analytics sets its own cookies and receives
              standard information from your browser, such as your IP address (which Google uses to
              estimate your approximate location), your device and browser type, and the page you
              came from.
            </p>
            <p>
              Google Analytics only runs on Sameeeish&apos;s public pages. It isn&apos;t loaded on
              the pages where you build, share, answer, or view a Wavelength, or on any other page
              that isn&apos;t one of those public pages (such as a &quot;page not found&quot; page),
              and Sameeeish is built to keep those pages&apos; addresses — which can contain your
              share link — and their contents, such as your questions, answers, and aliases, out of
              what Google Analytics receives. You can block Google Analytics at any time with your
              browser&apos;s privacy settings, a content blocker, or Google&apos;s{" "}
              <a href="https://tools.google.com/dlpage/gaoptout" rel="noopener noreferrer">
                opt-out add-on
              </a>
              , and Sameeeish keeps working normally.
            </p>
            <p>
              How Google handles what Google Analytics receives — including whether it can be used
              for Google&apos;s advertising features, which depends on the Google Analytics account
              settings — is governed by Google&apos;s own policies; see{" "}
              <a
                href="https://policies.google.com/technologies/partner-sites"
                rel="noopener noreferrer"
              >
                How Google uses information from sites or apps that use its services
              </a>
              .
            </p>

            <h2>Who can see a Wavelength</h2>
            <p>
              Only the two participants in a given Wavelength — the person who created it, and the
              person who opens its share link — can see its questions, answers, and results. This is
              enforced at the database level, not just hidden in the interface.
            </p>
            <p>
              Anyone who has the share link can join as the second participant, so treat it like a
              private invitation: only send it to the person you actually want to play with.
            </p>

            <h2>Cookies and local storage</h2>
            <p>
              Sameeeish sets one cookie of its own, named <code>sb-…-auth-token</code>, which keeps
              your anonymous session working so your answers stay tied to you instead of being lost
              on refresh. It lasts up to 400 days unless you clear it.
            </p>
            <p>
              On public pages, the Google Analytics script sets its own cookies on sameeeish.com,
              named <code>_ga</code> and <code>_ga_</code> followed by an identifier. Google uses
              them to tell visitors and visits apart; by default they last up to two years and are
              renewed on each visit, although your browser may shorten that. Sameeeish&apos;s own
              code doesn&apos;t set any advertising cookies.
            </p>
            <p>
              The Date Night page remembers the ideas you mark as favorites in your browser&apos;s
              local storage. That list stays on your device; it isn&apos;t sent to Sameeeish or to
              anyone else.
            </p>

            <h2>Third-party services</h2>
            <p>
              Sameeeish is built on Supabase, which stores your Wavelengths, questions, and answers
              and runs the anonymous authentication described above.
            </p>
            <p>
              The website itself is hosted on Vercel, which processes every request your browser
              makes to Sameeeish — including what you submit when you create or answer a Wavelength,
              on its way to Supabase. Depending on its configuration and its own policies, Vercel
              may log technical details of those requests, such as the address of the page requested
              (for a Wavelength, that address contains its share link), your IP address, and your
              browser type; see{" "}
              <a href="https://vercel.com/legal/privacy-notice" rel="noopener noreferrer">
                Vercel&apos;s privacy notice
              </a>
              .
            </p>
            <p>
              Google Analytics, described above, is set up to receive visit information from public
              pages only.
            </p>

            <h2>Retention and deletion</h2>
            <p>
              As the product stands today, Sameeeish does not automatically delete Wavelengths,
              questions, or answers, and there isn&apos;t yet a self-service way to delete your data
              from inside the app. We&apos;d rather tell you that plainly than promise a
              &quot;delete my data&quot; option that doesn&apos;t exist yet.
            </p>

            <h2>Changes to this policy</h2>
            <p>
              We&apos;ll update this page whenever how Sameeeish actually handles data changes, so
              it keeps describing real behavior rather than a promise we haven&apos;t built yet.
            </p>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
