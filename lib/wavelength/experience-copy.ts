/**
 * Per-experience contextual copy for the shared builder/invite/answer/
 * finalize screens (app/create/page.tsx, app/w/[token]/page.tsx,
 * app/w/[token]/answer/page.tsx, components/questionnaire/finalize-form.tsx,
 * components/wavelength/submit-final-form.tsx, components/wavelength/
 * invite-intro.tsx). Presentation-only, keyed by lib/wavelength/
 * ready-made-games.ts's own game ids — nothing here changes which
 * questions load, how answers save, or how scoring works; it only picks
 * which short, contextual sentence a given screen shows.
 *
 * Global QA/copy pass: every ready-made game used to share one identical,
 * generic sentence on each of these screens. This makes each screen say
 * what's actually happening in *this* game, without touching the shared
 * components' own logic, validation, or save behavior — only which
 * strings they're given to render.
 *
 * QA follow-up pass: extended to also cover B's invitation screen
 * (`invite`) and made `answer`'s body copy alias-aware (`(aAlias) =>
 * string`) so it can say e.g. "Every question here is about {aAlias}"
 * instead of a vaguer "them". `invite` is still a best-effort default for
 * every ready-made game — see app/w/[token]/page.tsx's own doc comment
 * for why B's *pre-claim* screen specifically can't always resolve the
 * real game id without a schema change this pass deliberately avoids;
 * when it can (the share link carries `?game=`), B gets the exact same
 * per-game copy below.
 */

export interface ExperienceCopy {
  /** One short line under the builder's title/subtitle (app/create/
   * page.tsx's CreateShellIntro) — what A is creating, and what happens
   * next. */
  builderIntro: string;
  /** B's invitation screen, before claiming (components/wavelength/
   * invite-intro.tsx) — replaces the eyebrow-adjacent heading + body. */
  inviteHeading: string;
  inviteText: (aAlias: string) => string;
  /** B's answer screen heading + helper line (app/w/[token]/answer/
   * page.tsx's AnswerShellIntro) — `answerText` names A by alias where it
   * makes the instruction clearer (e.g. "about {aAlias}", not "about
   * them"). */
  answerHeading: string;
  answerText: (aAlias: string) => string;
  /** B's "every question answered" screen, right before submitting
   * (components/wavelength/submit-final-form.tsx). Heading stays "All
   * set!" and the button stays "See our results" everywhere (approved,
   * unchanged) — only this body line varies. */
  finalText: string;
  /** A's own finalize/share button (components/questionnaire/
   * finalize-form.tsx), once every question is written and answered. */
  finalizeButtonLabel: string;
}

const MAKE_YOUR_OWN_COPY: ExperienceCopy = {
  builderIntro:
    "Pick your own questions, answer them yourself, then share the link so the other person can answer too.",
  inviteHeading: "Ready to jump in?",
  inviteText: (aAlias) =>
    `${aAlias} made a quiz and already answered it. Answer the same questions, then see the result together.`,
  answerHeading: "Time to answer",
  answerText: () =>
    "Go with your gut — there are no wrong answers, and you can change any answer any time before you submit.",
  finalText: "Every question is answered. Submit to see your result.",
  finalizeButtonLabel: "Answer. Share. See how much you're on the same page.",
};

const EXPERIENCE_COPY: Record<string, ExperienceCopy> = {
  "how-well-do-you-know-each-other": {
    builderIntro:
      "A relationship compatibility quiz. Answer the questions yourself, then invite your partner to answer the same ones and see where you align.",
    inviteHeading: "Ready to compare notes?",
    inviteText: (aAlias) =>
      `${aAlias} made a relationship compatibility quiz and already answered it. Answer the same questions, then see where you align and where you differ.`,
    answerHeading: "Time to answer",
    answerText: (aAlias) =>
      `Answer honestly — these are the same questions ${aAlias} already answered. Once you're both done, you'll see where your answers align and where they differ.`,
    finalText: "Ready to see where you align?",
    finalizeButtonLabel: "Answer. Share. See where you align.",
  },
  "getting-to-know-you": {
    builderIntro:
      "A conversation quiz to discover more about each other. Answer the questions yourself, then invite someone to play and see what you both learn.",
    inviteHeading: "Ready to get to know each other?",
    inviteText: (aAlias) =>
      `${aAlias} picked a set of questions to discover more about each other and already answered them. Answer honestly, and see what you both find out.`,
    answerHeading: "Time to answer",
    answerText: (aAlias) =>
      `Answer honestly — these are the same questions ${aAlias} already answered. You'll both get to discover more about each other once you're done.`,
    finalText: "Ready to see what you discovered about each other?",
    finalizeButtonLabel: "Answer. Share. Discover each other.",
  },
  "how-well-do-you-know-me": {
    builderIntro:
      "Each question is already written — you just write your own real answers, mark which one's true, then see how well they can guess.",
    inviteHeading: "Think you know them?",
    inviteText: (aAlias) =>
      `${aAlias} made a quiz about themself and already picked their real answers. Guess which ones they chose, and find out how well you actually know them.`,
    answerHeading: "Think you know them?",
    answerText: (aAlias) =>
      `Every question here is about ${aAlias}. Pick the answer you think ${aAlias} actually chose about themself — not your own answer. You'll find out how well you know them at the end.`,
    finalText: "Ready to find out how well you know them?",
    finalizeButtonLabel: "Lock it in. Share it. See how well they know you.",
  },
  "friendship-check": {
    builderIntro:
      "Each question is about a memory you share. Write your own answers, mark the real one, then see how well they remember it too.",
    inviteHeading: "How well do you remember us?",
    inviteText: (aAlias) =>
      `${aAlias} made a quiz about the memories, inside jokes, and moments you share. See how well you remember your friendship together.`,
    answerHeading: "How well do you remember us?",
    answerText: (aAlias) =>
      `Every question is about a memory, story, or inside joke ${aAlias} shares with you. Pick the answer you think ${aAlias} picked, based on what you remember together.`,
    finalText: "Ready to see how well you remember your friendship?",
    finalizeButtonLabel: "Lock it in. Share it. See how well they remember.",
  },
};

export function getExperienceCopy(gameId: string | undefined): ExperienceCopy {
  return (gameId && EXPERIENCE_COPY[gameId]) || MAKE_YOUR_OWN_COPY;
}
