import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";

import { BackLink } from "@/components/landing/back-link";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";

// /contact — a short, focused contact page pointing at the one real,
// verified contact destination for Sameeeish (hello@sameeeish.com). Same
// pattern as every other marketing route (own font instantiation, shared
// LandingHeader/LandingFooter, .landing--internal wrapper, BackLink). No
// contact form, no database table, no third-party service — just a
// mailto: link, per the brief this page was built from.
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

const PAGE_DESCRIPTION = "Questions, feedback, or just want to say hi? We'd love to hear from you.";

export const metadata: Metadata = {
  title: "Contact Sameeeish",
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Sameeeish",
    description: PAGE_DESCRIPTION,
    url: "/contact",
    siteName: "Sameeeish",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Contact Sameeeish",
    description: PAGE_DESCRIPTION,
  },
};

export default function ContactPage() {
  return (
    <div className={`${fraunces.variable} ${nunitoSans.variable} landing landing--internal`}>
      <LandingHeader />
      <main>
        <BackLink href="/" />
        <section className="landing-section landing-how landing-legal">
          <h1 className="landing-section__heading">We&apos;d love to hear from you.</h1>
          <div className="landing-legal__body">
            <p>Questions, feedback, or just want to say hi? We&apos;d love to hear from you.</p>
          </div>
          <p className="landing-legal__cta">
            <a href="mailto:hello@sameeeish.com" className="landing-button landing-button--primary">
              hello@sameeeish.com
            </a>
          </p>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
