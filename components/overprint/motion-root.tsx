"use client";

import { LazyMotion, MotionConfig } from "motion/react";
import type { ReactNode } from "react";

// Loaded on first use and shared by every island, so pages that never
// animate never download Motion's animation features at all.
const loadFeatures = () => import("motion/react").then((mod) => mod.domMax);

/**
 * Wraps one interactive island (not the whole app) in Motion's lazy
 * feature bundle. `strict` makes any accidental `motion.*` import (which
 * would pull the full ~34 KB bundle) throw in development instead of
 * quietly shipping; use `m.*` inside. `reducedMotion="user"` turns
 * transform and layout animation off under prefers-reduced-motion while
 * keeping opacity, so content still appears, it just doesn't travel.
 */
export function MotionRoot({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
