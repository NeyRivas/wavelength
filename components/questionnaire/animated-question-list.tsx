"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

const TRANSITION = "transform 220ms ease";

/**
 * Wraps the question card list (`.create-card-list`) and plays a short,
 * simple slide whenever a card's on-screen position changes between
 * renders — most notably after `moveQuestion` (app/actions/questions.ts)
 * swaps two neighbors via the `reorder_questions` RPC and Next.js
 * revalidates `/create` with the new order.
 *
 * Purely visual: this component never reorders, edits, or even reads the
 * underlying question data — it only measures each already-rendered `<li>`
 * via `getBoundingClientRect()` before and after a render, and animates the
 * resulting delta with a CSS `transform`. Nothing else about the element is
 * ever touched (no color, no opacity, no background) — the whole `<li>`,
 * colored header and all, slides as one solid unit, so a card's tint can
 * never appear to shift or interpolate during the move; the only thing
 * animating is position. The actual persisted order, the Server Action,
 * and the RPC are completely untouched.
 *
 * Implementation note (simplicity/robustness pass): every moved card's
 * "snap back, then release" step now happens in two clean batched passes —
 * first every card that moved is snapped back with no transition, then one
 * single forced reflow, then every card is released together with the
 * transition on. Doing this one element at a time (measuring, forcing a
 * reflow, then releasing, per element, in a loop) risked the browser
 * painting a half-updated frame between two elements' individual snaps,
 * which could look like a flash/jump right as the cards crossed — this
 * batched version can't produce that, since nothing paints until every
 * card's starting position has already been set.
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
      // Pass 1: snap every moved card back to its old spot, no transition.
      const moved: HTMLLIElement[] = [];
      items.forEach((el) => {
        const id = el.dataset.flipId;
        if (!id) return;
        const prev = prevRects.current.get(id);
        const next = nextRects.get(id);
        if (!prev || !next) return;

        const deltaY = prev.top - next.top;
        if (Math.abs(deltaY) < 1) return;

        el.style.transition = "none";
        el.style.transform = `translateY(${deltaY}px)`;
        moved.push(el);
      });

      if (moved.length > 0) {
        // One forced reflow for the whole batch, then release them all
        // together on the next paint.
        void container.getBoundingClientRect();
        moved.forEach((el) => {
          el.style.transition = TRANSITION;
          el.style.transform = "";
        });
      }
    }

    prevRects.current = nextRects;
  });

  return (
    <ol className="create-card-list" ref={containerRef}>
      {children}
    </ol>
  );
}
