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
 */
const DateNightExperience = dynamic(
  () => import("./date-night-experience").then((mod) => mod.DateNightExperience),
  { ssr: false },
);

export function DateNightExperienceLoader() {
  return <DateNightExperience />;
}
