"use client";

import { inView } from "motion";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Site-wide scroll entrance, driven by plain markup attributes so section
 * components stay Server Components:
 *
 *   data-reveal            the element fades up into place once it scrolls in
 *   data-reveal="stagger"  its direct children do, one after another
 *
 * Same motion vocabulary as the hero's own entrance (globals.css
 * `hero-enter`): a 14px rise with the site's `cubic-bezier(0.22, 1, 0.36, 1)`
 * ease-out.
 *
 * Nothing is ever hidden that a visitor could already see. On mount (and on
 * every client-side route change) only elements whose top is still below the
 * fold are marked `data-reveal-state="pending"` — which globals.css hides —
 * so above-the-fold content, no-JS visitors, and reduced-motion visitors all
 * get the page exactly as server-rendered, with no flash and no layout
 * shift (opacity + translate only).
 *
 * Motion's `inView` does the observing. The animation itself is a native
 * Web Animation with a single "from" keyframe and `fill: "backwards"`: it
 * eases from hidden to the element's own computed style and leaves nothing
 * behind, so it never overrides an element's own `transition`, hover
 * transform, or resting opacity once it finishes.
 */

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const DURATION_MS = 700;
const STAGGER_MS = 80;
const MAX_STAGGER_STEPS = 6;
const HIDDEN: Keyframe = { opacity: 0, translate: "0 14px", offset: 0 };

function reveal(element: HTMLElement) {
  element.dataset.revealState = "shown";
  // A stagger parent's own `data-reveal` children (e.g. a card grid under a
  // section's eyebrow + heading) run their own entrance when they scroll in.
  const targets =
    element.dataset.reveal === "stagger"
      ? Array.from(element.children).filter((child) => !child.hasAttribute("data-reveal"))
      : [element];
  targets.forEach((target, index) => {
    target.animate([HIDDEN], {
      duration: DURATION_MS,
      delay: Math.min(index, MAX_STAGGER_STEPS) * STAGGER_MS,
      easing: EASE,
      fill: "backwards",
    });
  });
}

export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof Element.prototype.animate !== "function") return;

    const fold = window.innerHeight;
    const pending = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-reveal-state])"),
    ).filter((element) => element.getBoundingClientRect().top > fold);

    const stops = pending.map((element) => {
      element.dataset.revealState = "pending";
      const stop = inView(
        element,
        () => {
          reveal(element);
          stop();
        },
        { margin: "0px 0px -10% 0px" },
      );
      return stop;
    });

    return () => {
      stops.forEach((stop) => stop());
      // Anything still waiting goes back to plain, visible markup rather
      // than staying hidden behind an observer that no longer exists.
      for (const element of pending) {
        if (element.dataset.revealState === "pending") delete element.dataset.revealState;
      }
    };
  }, [pathname]);

  return null;
}
