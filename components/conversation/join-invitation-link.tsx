"use client";

/** The invitation's name field (components/wavelength/join-form.tsx). */
const JOIN_INPUT_ID = "join-alias";

/**
 * The CTA ThirtySixQuestionsContent shows in B's invitation context, in
 * place of "Start the experience". It never navigates or submits anything:
 * it scrolls back up to the invitation at the top of the same page and
 * puts the cursor in its name field, so the invitation stays B's one
 * primary action. Without JavaScript it's a plain in-page link to that
 * field.
 */
export function JoinInvitationLink({ label }: { label: string }) {
  return (
    <a
      href={`#${JOIN_INPUT_ID}`}
      className="landing-button landing-button--primary landing-button--play"
      onClick={(event) => {
        const input = document.getElementById(JOIN_INPUT_ID);
        if (!input) return;
        event.preventDefault();
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        input.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        input.focus({ preventScroll: true });
      }}
    >
      {label} <span aria-hidden="true">↑</span>
    </a>
  );
}
