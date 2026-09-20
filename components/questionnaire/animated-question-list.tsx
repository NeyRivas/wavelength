"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

const TRANSITION = "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Wraps the question card list (`.create-card-list`) and plays a short
 * FLIP (First-Last-Invert-Play) transform whenever a card's on-screen
 * position changes between renders — most notably after `moveQuestion`
 * (app/actions/questions.ts) swaps two neighbors via the `reorder_questions`
 * RPC and Next.js revalidates `/create` with the new order.
 *
 * Purely visual: this component never reorders, edits, or even reads the
 * underlying question data — it only measures each already-rendered `<li>`
 * via `getBoundingClientRect()` before and after a render, and animates the
 * resulting delta with a CSS transform. The actual persisted order, the
 * Server Action, and the RPC are completely untouched; a card animating
 * here is always just following data that already changed server-side.
 *
 * Each `<li>` child must carry `data-flip-id` set to its question's stable
 * id (questionnaire-builder.tsx sets this to the same id already used as
 * its React `key`) — that's what lets this tell "the same card, new spot"
 * apart from "a different card, same spot" across renders.
 */
export function AnimatedQuestionList({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLOListElement>(null);
  const prevRects = useRef<Map<string, DOMRect>>(new Map());

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = Array.from(container.children).filter(
      (el): el is HTMLLIElement => el instanceof HTMLLIElement,
    );
    const nextRects = new Map<string, DOMRect>();
    items.forEach((el) => {
      const id = el.dataset.flipId;
      if (id) nextRects.set(id, el.getBoundingClientRect());
    });

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!reduceMotion) {
      items.forEach((el) => {
        const id = el.dataset.flipId;
        if (!id) return;
        const prev = prevRects.current.get(id);
        const next = nextRects.get(id);
        if (!prev || !next) return;

        const deltaY = prev.top - next.top;
        if (Math.abs(deltaY) < 1) return;

        // Invert: snap the card back to where it visually was, with no
        // transition, then release it to its real (identity) position on
        // the next frame with a transition — the browser animates the
        // difference, reading as the card sliding from old spot to new.
        el.style.transition = "none";
        el.style.transform = `translateY(${deltaY}px)`;
        el.getBoundingClientRect(); // force layout before re-enabling the transition
        el.style.transition = TRANSITION;
        el.style.transform = "";
      });
    }

    prevRects.current = nextRects;
  });

  return (
    <ol className="create-card-list" ref={containerRef}>
      {children}
    </ol>
  );
}
