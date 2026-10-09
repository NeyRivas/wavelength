import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";
import Link from "next/link";

import { BackLink } from "@/components/landing/back-link";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";

// /terms — the terms under which Sameeeish, a free, no-account
// questionnaire app, can be used. Same pattern as every other marketing
// route (own font instantiation, shared LandingHeader/LandingFooter,
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

const PAGE_DESCRIPTION = "The terms for using Sameeeish.";

export const metadata: Metadata = {
  title: "Terms of Service — Sameeeish",
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "Terms of Service — Sameeeish",
    description: PAGE_DESCRIPTION,
    url: "/terms",
    siteName: "Sameeeish",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Terms of Service — Sameeeish",
    description: PAGE_DESCRIPTION,
  },
};

export default function TermsPage() {
  return (
    <div className={`${fraunces.variable} ${nunitoSans.variable} landing landing--internal`}>
      <LandingHeader />
      <main>
        <BackLink href="/" />
        <section className="landing-section landing-how landing-legal">
          <h1 className="landing-section__heading">Terms of Service</h1>
          <div className="landing-legal__body">
            <h2>Using Sameeeish</h2>
            <p>
              Sameeeish is a free web app for creating a short questionnaire, sharing it with one
              other person, and comparing your answers. There&apos;s no account or payment required
              to use it.
            </p>

            <h2>Your content</h2>
            <p>
              You&apos;re responsible for the questions and answers you create or submit. Please
              don&apos;t use Sameeeish to collect or share anything illegal, harassing, or that
              violates someone else&apos;s privacy without their consent.
            </p>

            <h2>No warranty</h2>
            <p>
              Sameeeish is provided &quot;as is,&quot; without warranties of any kind. We don&apos;t
              guarantee it will always be available, error-free, or fit for a particular purpose.
            </p>

            <h2>Limitation of liability</h2>
            <p>
              To the extent permitted by law, Sameeeish and the people who built it aren&apos;t
              liable for damages arising from your use of, or inability to use, the service.
            </p>

            <h2>Changes</h2>
            <p>
              We may update these terms, or Sameeeish itself, at any time. Continuing to use
              Sameeeish after a change means you accept the updated terms.
            </p>

            <h2>Privacy</h2>
            <p>
              See our <Link href="/privacy">Privacy Policy</Link> for details on what information
              Sameeeish stores and how it&apos;s used.
            </p>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
