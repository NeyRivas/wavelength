/**
 * Per-experience contextual copy for the shared builder/answer/finalize
 * screens (app/create/page.tsx, app/w/[token]/answer/page.tsx,
 * components/questionnaire/finalize-form.tsx). Presentation-only, keyed
 * by lib/wavelength/ready-made-games.ts's own game ids — nothing here
 * changes which questions load, how answers save, or how scoring works;
 * it only picks which short, contextual sentence a given screen shows.
 *
 * Global QA/copy pass: every ready-made game used to share one identical,
 * generic sentence on each of these screens ("Time to answer", "Go with
 * your gut…", "Answer. Share. See how much you're on the same page.",
 * "Every question is answered. Submit to see where your wavelengths
 * meet.") — accurate for the original compatibility quiz, increasingly
 * wrong once Friends added two non-compatibility games with a completely
 * different mechanic (A writes the quiz, B guesses — see
 * lib/wavelength/guess-accuracy.ts / friendship-memory.ts). This makes
 * each screen say what's actually happening in *this* game, without
 * touching the shared components' own logic, validation, or save
 * behavior — only which strings they're given to render.
 */

export interface ExperienceCopy {
  /** One short line under the builder's title/subtitle (app/create/
   * page.tsx's CreateShellIntro) — what this experience is, briefly. */
  builderIntro: string;
  /** B's answer screen heading + helper line (app/w/[token]/answer/
   * page.tsx's AnswerShellIntro). */
  answerHeading: string;
  answerText: string;
  /** B's "every question answered" screen, right before submitting
   * (components/wavelength/submit-final-form.tsx). Heading stays "All
   * set!" everywhere (approved, unchanged) — only this body line varies. */
  finalText: string;
  /** A's own finalize/share button (components/questionnaire/
   * finalize-form.tsx), once every question is written and answered. */
  finalizeButtonLabel: string;
}

const MAKE_YOUR_OWN_COPY: ExperienceCopy = {
  builderIntro:
    "Pick your own questions, answer first, then share the link so they can answer too.",
  answerHeading: "Time to answer",
  answerText:
    "Go with your gut — there are no wrong answers, and you can change any answer any time before you submit.",
  finalText: "Every question is answered. Submit to see your result.",
  finalizeButtonLabel: "Answer. Share. See how much you're on the same page.",
};

const EXPERIENCE_COPY: Record<string, ExperienceCopy> = {
  "how-well-do-you-know-each-other": {
    builderIntro:
      "A relationship compatibility quiz — you both answer, then see where you align and where you differ.",
    answerHeading: "Time to answer",
    answerText:
      "Answer honestly — there are no wrong answers. Once you're both done, you'll see where your answers align and where they differ.",
    finalText: "Every question is answered. Submit to see where you and your partner align.",
    finalizeButtonLabel: "Answer. Share. See where you align.",
  },
  "getting-to-know-you": {
    builderIntro:
      "A conversation quiz to discover more about each other — stories, interests, and things that don't usually come up.",
    answerHeading: "Time to answer",
    answerText:
      "Answer honestly — there are no wrong answers. You'll both get to discover more about each other once you're done.",
    finalText: "Every question is answered. Submit to see what you discovered about each other.",
    finalizeButtonLabel: "Answer. Share. Discover each other.",
  },
  "how-well-do-you-know-me": {
    builderIntro:
      "Write a quiz about yourself, mark your real answers, then see how well they guess.",
    answerHeading: "Think you know them?",
    answerText:
      "Choose the answers you think they picked. Trust your instincts — you'll find out how well you know them at the end.",
    finalText: "Ready to find out how well you know them?",
    finalizeButtonLabel: "Lock it in. Share it. See how well they know you.",
  },
  "friendship-check": {
    builderIntro:
      "Put your friendship to the test — see how well they remember the stories and moments you share.",
    answerHeading: "How well do you remember us?",
    answerText:
      "Choose the answers you think your friend picked. See how well you remember the stories, moments, and memories you share.",
    finalText: "Ready to see how well you remember your friendship?",
    finalizeButtonLabel: "Lock it in. Share it. See how well they remember.",
  },
};

export function getExperienceCopy(gameId: string | undefined): ExperienceCopy {
  return (gameId && EXPERIENCE_COPY[gameId]) || MAKE_YOUR_OWN_COPY;
}
