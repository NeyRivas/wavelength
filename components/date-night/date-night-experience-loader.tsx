"use client";

import dynamic from "next/dynamic";

/**
 * `next/dynamic`'s `ssr: false` can only be used from a Client Component
 * in the App Router — this tiny wrapper is that boundary, so the actual
 * page (app/play/dating-couples/date-night/page.tsx) can stay a plain
 * Server Component. DateNightExperience's own state (the initial random
 * question, saved favorites) is only ever known in the browser, so
 * skipping SSR for it entirely means its lazy `useState` initializers can
 * safely call `Math.random()`/read `localStorage` with no server-render
 * to mismatch against.
 *
 * Layout-shift fix: until the deck's chunk loads, `loading` renders an
 * empty slot (server-rendered too) roughly the height of the deck's
 * first state (.dn-experience-slot in app/globals.css), so the preview and
 * guide below don't jump down when the deck appears. The slot is replaced
 * by the deck itself, so it never constrains the deck afterwards (e.g.
 * when a search shortens the Browse list). The deck is unchanged.
 */
const DateNightExperience = dynamic(
  () => import("./date-night-experience").then((mod) => mod.DateNightExperience),
  {
    ssr: false,
    loading: () => <div className="dn-experience-slot" aria-hidden="true" />,
  },
);

export function DateNightExperienceLoader() {
  return <DateNightExperience />;
}
