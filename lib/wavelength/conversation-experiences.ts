/**
 * Fixed conversation experiences — the first SEO-driven, ready-made
 * experiences ("36 Questions to Fall in Love"). Each one is still an
 * ordinary Wavelength: app/actions/ready-made-games.ts seeds a DRAFT with
 * these questions (type `open`, written answers), A answers and shares via
 * the existing finalize/share flow, B claims and answers via the existing
 * join flow, and both read the shared record on the existing
 * /w/[token]/result route once COMPLETED.
 *
 * What makes it "fixed": the draft is inserted with
 * `fixed_question_count`, which the database uses to lock the question set
 * (no edits, deletes, reorders, or extra questions — see
 * supabase/migrations/20261025120100_fixed_conversation_experiences.sql),
 * so every instance asks exactly these questions in exactly this order.
 *
 * Nothing here is scored. There is no compatibility percentage, tier, or
 * verdict anywhere in this module — the result is the conversation itself:
 * both participants' answers, side by side, stage by stage.
 *
 * Adding another experience = one more entry in CONVERSATION_EXPERIENCES
 * plus a matching READY_MADE_GAMES entry (ready-made-games.ts) and a
 * public landing page under app/play/.
 */

export interface ConversationStage {
  /** 1-based, shown as "Stage 1". */
  number: number;
  title: string;
  description: string;
  questions: readonly string[];
}

export interface ConversationExperience {
  /** Same id as its READY_MADE_GAMES entry and the stored source_game_id. */
  id: string;
  title: string;
  stages: readonly ConversationStage[];
}

/**
 * Original questions written for Sameeeish. Inspired by the general idea
 * of a conversation that deepens gradually (Aron et al., 1997 — see the
 * public landing page for context), but deliberately NOT the published
 * research list, and never presented as such. Order matters: stage 1 is
 * comfortable and personal, stage 2 moves into experiences, values and
 * memories, stage 3 into feelings, hopes, and each other.
 *
 * Every question is answered in writing by each participant on their own,
 * so none of them assume both people are in the same room at the same
 * moment ("the person you're answering these questions with", not "me").
 */
export const THIRTY_SIX_QUESTIONS: ConversationExperience = {
  id: "36-questions-to-fall-in-love",
  title: "36 Questions to Fall in Love",
  stages: [
    {
      number: 1,
      title: "Building a Connection",
      description:
        "Light, personal questions to get comfortable — the places, habits, and small joys that make you who you are.",
      questions: [
        "What's a small, ordinary thing that reliably puts you in a good mood?",
        "Which place from your childhood can you still picture in detail?",
        "What's a skill or hobby you picked up that surprised the people around you?",
        "What does a really good weekend morning look like for you?",
        "What's a book, film, or song that arrived in your life at exactly the right moment?",
        "If you could spend a year living in another city, where would you go and why?",
        "What's something you're curious about right now and would love to learn more about?",
        "Who was the first friend you remember choosing for yourself, and what drew you to them?",
        "What's a compliment you received that you still think about?",
        "What's a tradition, big or small, that you'd like to keep for the rest of your life?",
        "What kind of moments make you lose track of time?",
        "What's something about where you grew up that you only appreciated after you left?",
      ],
    },
    {
      number: 2,
      title: "Going Deeper",
      description:
        "Experiences, values, and memories — the moments and beliefs that have shaped you.",
      questions: [
        "What's a decision you made that changed the direction of your life?",
        "When did you last feel truly proud of yourself, and why did that moment matter?",
        "Which value do you try hardest to live by, even when it's inconvenient?",
        "What's a lesson you learned the hard way that you're now grateful for?",
        "Who taught you the most about how to treat other people, and how did they teach you?",
        "What's something you believed strongly a few years ago that you see differently now?",
        "What helps you feel at home when you're somewhere unfamiliar?",
        "What's a fear you've grown out of, and what helped you move past it?",
        "When you're going through something difficult, what do you most need from the people around you?",
        "When did a stranger's kindness stay with you long after the moment passed?",
        "What part of your everyday life would you protect no matter how busy you got?",
        "What do you hope people feel after spending time with you?",
      ],
    },
    {
      number: 3,
      title: "Growing Closer",
      description:
        "Feelings, hopes, and what you see in each other — the questions that ask for a little more openness.",
      questions: [
        "What's something you rarely say out loud but often feel?",
        "When do you feel most like yourself around another person?",
        "What's a part of yourself you're still learning to accept?",
        "What's a hope for your future that you don't often share?",
        "How do you usually show someone you care, and how do you most like to be cared for?",
        "What's a question you wish more people asked you?",
        "What makes it hard for you to let people in, and what makes it easier?",
        "What does feeling truly understood look like for you?",
        "When did you last feel really close to someone, and what made it feel that way?",
        "What's something you appreciate about the person you're answering these questions with?",
        "What's something you'd love the two of you to experience together?",
        "What's one thing you'd like them to know about you that hasn't come up yet?",
      ],
    },
  ],
};

export const CONVERSATION_EXPERIENCES: readonly ConversationExperience[] = [THIRTY_SIX_QUESTIONS];

export function getConversationExperience(
  id: string | null | undefined,
): ConversationExperience | undefined {
  return id ? CONVERSATION_EXPERIENCES.find((experience) => experience.id === id) : undefined;
}

/** Every question of an experience, in play order. */
export function conversationQuestionTexts(experience: ConversationExperience): string[] {
  return experience.stages.flatMap((stage) => [...stage.questions]);
}

export function conversationQuestionCount(experience: ConversationExperience): number {
  return experience.stages.reduce((total, stage) => total + stage.questions.length, 0);
}

export interface StagePosition {
  stage: ConversationStage;
  /** 0-based index of the stage within the experience. */
  stageIndex: number;
  /** 0-based position of the question within its stage. */
  indexInStage: number;
  /** 0-based index of the stage's first question within the experience. */
  stageStart: number;
}

/** Which stage a 0-based question index belongs to (by play order). */
export function stagePositionForIndex(
  experience: ConversationExperience,
  index: number,
): StagePosition {
  let stageStart = 0;
  for (const [stageIndex, stage] of experience.stages.entries()) {
    if (index < stageStart + stage.questions.length) {
      return { stage, stageIndex, indexInStage: index - stageStart, stageStart };
    }
    stageStart += stage.questions.length;
  }
  throw new RangeError(`question index ${index} is outside ${experience.id}`);
}

// ── shared conversation record (result screen) ───────────────────────────

export interface ConversationQuestionRow {
  id: string;
  text: string;
  order_index: number;
}

export interface ConversationAnswerRow {
  question_id: string;
  participant: "A" | "B";
  value: number | string;
}

export interface ConversationRecordEntry {
  id: string;
  /** 1-based number across the whole experience. */
  number: number;
  text: string;
  answerA: string;
  answerB: string;
}

export interface ConversationRecordStage {
  stage: ConversationStage;
  entries: ConversationRecordEntry[];
}

export class ConversationRecordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConversationRecordError";
  }
}

/**
 * Both participants' written answers, grouped by question and organized by
 * stage. Pure and deterministic; never computes or returns a score. Throws
 * ConversationRecordError if the rows aren't a complete, two-sided record
 * of this experience — the result page only calls this for a COMPLETED
 * wavelength, where the state trigger already guarantees that, so a throw
 * means corrupted data, never a partial record shown to anyone.
 */
export function buildConversationRecord(
  experience: ConversationExperience,
  questions: ConversationQuestionRow[],
  answers: ConversationAnswerRow[],
): ConversationRecordStage[] {
  const expected = conversationQuestionCount(experience);
  if (questions.length !== expected) {
    throw new ConversationRecordError(`expected ${expected} questions, got ${questions.length}`);
  }

  const answersByQuestion = new Map<string, { A?: string; B?: string }>();
  for (const answer of answers) {
    if (typeof answer.value !== "string") {
      throw new ConversationRecordError(`answer to ${answer.question_id} is not written text`);
    }
    const pair = answersByQuestion.get(answer.question_id) ?? {};
    if (pair[answer.participant] !== undefined) {
      throw new ConversationRecordError(`duplicate answer to ${answer.question_id}`);
    }
    pair[answer.participant] = answer.value;
    answersByQuestion.set(answer.question_id, pair);
  }

  const ordered = [...questions].sort((a, b) => a.order_index - b.order_index);
  const record: ConversationRecordStage[] = experience.stages.map((stage) => ({
    stage,
    entries: [],
  }));

  ordered.forEach((question, index) => {
    const pair = answersByQuestion.get(question.id);
    if (pair?.A === undefined || pair.B === undefined) {
      throw new ConversationRecordError(`question ${question.id} is missing an answer`);
    }
    const { stageIndex } = stagePositionForIndex(experience, index);
    record[stageIndex]!.entries.push({
      id: question.id,
      number: index + 1,
      text: question.text,
      answerA: pair.A,
      answerB: pair.B,
    });
  });

  return record;
}
