import type { ReactNode } from "react";
import Link from "next/link";

import { HeroDemo } from "./hero-demo";

interface HeroService {
  href: string;
  title: string;
  description: string;
  modifier: "couples" | "friends" | "date-night" | "custom";
  icon: ReactNode;
}

const ICON_PROPS = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const SERVICES: HeroService[] = [
  {
    href: "/play/dating-couples/couples-compatibility-test",
    title: "Couples quiz",
    description: "How in sync are you two?",
    modifier: "couples",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10z" />
      </svg>
    ),
  },
  {
    href: "/play/friends/friendship-test",
    title: "Friends quiz",
    description: "Who really knows who?",
    modifier: "friends",
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="9" cy="8" r="3" />
        <circle cx="16.5" cy="9" r="2.5" />
        <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
        <path d="M14.5 14.2A4.5 4.5 0 0 1 21 18" />
      </svg>
    ),
  },
  {
    href: "/play/dating-couples/date-night",
    title: "Date night",
    description: "Conversation starters for a night in",
    modifier: "date-night",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
      </svg>
    ),
  },
  {
    href: "/create",
    title: "Make your own",
    description: "Write your own questions",
    modifier: "custom",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M4 20h4L19 9l-4-4L4 16v4z" />
        <path d="M13.5 6.5l4 4" />
      </svg>
    ),
  },
];

/**
 * Hero: the rounded pastel frame (unchanged — its ambient wash and glow
 * still float exactly as before) holding two columns. On the left, a
 * motion graphic of how Sameeeish works, drawn with the app's own UI
 * (components/landing/hero-demo.tsx). On the right, the eyebrow, the
 * headline and one link to each of the four main ways to play, styled
 * like How it works' vivid cards with a slowly flowing gradient (see
 * `.hero-service` in app/globals.css).
 *
 * On narrow screens the columns stack with the headline and links first,
 * so the page still opens on its message and its actions.
 */
export function LandingHero() {
  return (
    <section className="landing-hero">
      <div className="landing-hero__frame">
        <div className="landing-hero__ambient" aria-hidden="true">
          <div className="landing-hero__ambient-wash" />
          <div className="landing-hero__ambient-glow" />
        </div>

        <div className="landing-hero__inner">
          <div className="landing-hero__demo">
            <HeroDemo />
          </div>

          <div className="landing-hero__content">
            <p className="landing-eyebrow landing-hero__eyebrow">
              <span
                className="landing-eyebrow__dot landing-eyebrow__dot--lavender"
                aria-hidden="true"
              />
              <span
                className="landing-eyebrow__dot landing-eyebrow__dot--blue"
                aria-hidden="true"
              />
              A game for two
            </p>

            <h1 className="landing-hero__heading">Are you really on the same page?</h1>

            <ul className="landing-hero__services" aria-label="Ways to play">
              {SERVICES.map((service) => (
                <li key={service.href}>
                  <Link
                    href={service.href}
                    className={`hero-service hero-service--${service.modifier}`}
                  >
                    <span className="hero-service__icon">{service.icon}</span>
                    <span className="hero-service__text">
                      <span className="hero-service__title">{service.title}</span>
                      <span className="hero-service__description">{service.description}</span>
                    </span>
                    <svg className="hero-service__arrow" {...ICON_PROPS} strokeWidth={2.2}>
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>

            <p className="landing-hero__note">Free · No sign-up needed</p>
          </div>
        </div>
      </div>
    </section>
  );
}
