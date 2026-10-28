"use client";

import { m, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import { useRef } from "react";

import { MotionRoot } from "@/components/overprint/motion-root";

/**
 * Closing call to action. Two large discs start apart and slide into an
 * overlap as the section scrolls toward the middle of the viewport, so
 * the page ends on the same image the product ends on. Scroll-linked
 * values bypass MotionConfig's reducedMotion, so that case lives in CSS
 * (.op-closing__disc in app/overprint.css): the discs simply sit in their
 * final, overlapped position. Doing it in CSS rather than branching on
 * useReducedMotion() here keeps server and client markup identical.
 */
function Closing() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const youX = useTransform(scrollYProgress, [0, 1], ["-58%", "-18%"]);
  const themX = useTransform(scrollYProgress, [0, 1], ["58%", "18%"]);

  return (
    <section ref={ref} className="op-closing" aria-labelledby="closing-heading">
      <div className="op-closing__discs" aria-hidden="true">
        <m.span
          className="op-disc op-disc--you op-closing__disc op-closing__disc--you"
          style={{ x: youX }}
        />
        <m.span
          className="op-disc op-disc--them op-closing__disc op-closing__disc--them"
          style={{ x: themX }}
        />
      </div>
      <div className="op-closing__content">
        <h2 id="closing-heading" className="op-closing__heading">
          See where you overlap.
        </h2>
        <p className="op-closing__text">
          A few minutes each. You might learn something new about someone you&apos;ve known for
          years.
        </p>
        <Link href="/play" className="op-button op-button--ink">
          Start playing
        </Link>
      </div>
    </section>
  );
}

export function LandingCtaSection() {
  return (
    <MotionRoot>
      <Closing />
    </MotionRoot>
  );
}
