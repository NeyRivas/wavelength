import { describe, expect, it } from "vitest";

import { DATE_NIGHT_QUESTIONS, MOOD_LABELS, MOODS } from "../../lib/date-night/questions";
import { THIRTY_SIX_QUESTIONS } from "../../lib/wavelength/conversation-experiences";
import { getExperienceCopy } from "../../lib/wavelength/experience-copy";
import { READY_MADE_GAMES } from "../../lib/wavelength/ready-made-games";

// Regression guard for content that SEO and catalog work must never touch:
// every ready-made game's questions, answer options, types, categories,
// order, and result mode; the 36 Questions stages; the Date Night deck; and
// the invitation/answer copy B sees. Card presentation (title, subtitle,
// href, the card's secondary link) is deliberately left out — that's
// covered by tests/unit/play-catalog.test.ts, and may change on purpose.
//
// If one of these snapshots fails, the change touched protected content.
// Don't update the snapshot unless that change was explicitly approved.

describe("protected questionnaire content", () => {
  it("keeps every ready-made game's questions, options, order, and result mode", () => {
    expect(
      READY_MADE_GAMES.map((game) => ({
        id: game.id,
        group: game.group,
        resultMode: game.resultMode ?? null,
        conversation: game.conversation ?? false,
        questions: game.questions,
      })),
    ).toMatchSnapshot();
  });

  it("keeps the 36 Questions stages, titles, descriptions, and question wording", () => {
    expect(THIRTY_SIX_QUESTIONS).toMatchSnapshot();
  });

  it("keeps the Date Night deck, its moods, and their labels", () => {
    expect({
      moods: MOODS,
      labels: MOOD_LABELS,
      questions: DATE_NIGHT_QUESTIONS,
    }).toMatchSnapshot();
  });

  it("keeps the builder, invitation, and answer copy for every game", () => {
    const copy = [undefined, ...READY_MADE_GAMES.map((game) => game.id)].map((id) => {
      const c = getExperienceCopy(id);
      return {
        id: id ?? "make-your-own",
        builderIntro: c.builderIntro,
        inviteHeading: c.inviteHeading,
        inviteText: c.inviteText("Alex"),
        answerHeading: c.answerHeading,
        answerText: c.answerText("Alex"),
        finalText: c.finalText,
        finalizeButtonLabel: c.finalizeButtonLabel,
      };
    });
    expect(copy).toMatchSnapshot();
  });
});
