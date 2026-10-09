import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";

import { BackLink } from "@/components/landing/back-link";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";

// /privacy — describes what Sameeeish actually does with data today,
// based on reading the real implementation (anonymous Supabase Auth,
// the wavelengths/questions/answers tables and their row-level security,
// and the absence of any analytics/tracking script or deletion flow) —
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
              Sameeeish doesn&apos;t ask for a name, email address, or password to use it. When you
              open the app, it automatically starts an anonymous session through Supabase, the
              service that runs Sameeeish&apos;s backend — this lets the app recognize
              &quot;you&quot; as you create and answer questionnaires, without you providing any
              identifying information.
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
              We don&apos;t collect your IP address or device information, and Sameeeish has no
              analytics, advertising, or tracking scripts of any kind.
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

            <h2>Cookies</h2>
            <p>
              The only cookies Sameeeish sets are the ones needed to keep your anonymous session
              working, so your answers stay tied to you instead of being lost on refresh. We
              don&apos;t use cookies for advertising or analytics.
            </p>

            <h2>Third-party services</h2>
            <p>
              Sameeeish is built on Supabase, which hosts the database and runs the anonymous
              authentication described above. Supabase is the only third-party service that
              processes Sameeeish data.
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
