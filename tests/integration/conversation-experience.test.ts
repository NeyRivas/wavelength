import { beforeEach, describe, expect, it } from "vitest";

import {
  conversationQuestionCount,
  conversationQuestionTexts,
  THIRTY_SIX_QUESTIONS,
} from "../../lib/wavelength/conversation-experiences";

import { asAdmin, asRequest, createTestUser, resetDatabase } from "./setup/db";
import { addQuestions, claimAsB, createDraft, finalizeAsA, submitFinalB } from "./setup/fixtures";

// Fixed conversation experiences ("36 Questions to Fall in Love"):
// supabase/migrations/20261025120100_fixed_conversation_experiences.sql.
// Seeded exactly the way app/actions/ready-made-games.ts does it — one
// wavelength INSERT carrying source_game_id + fixed_question_count, then
// one multi-row INSERT of every `open` question — as A's own session.

const TEXTS = conversationQuestionTexts(THIRTY_SIX_QUESTIONS);
const COUNT = conversationQuestionCount(THIRTY_SIX_QUESTIONS);

beforeEach(async () => {
  await resetDatabase();
});

async function seedConversation(): Promise<{
  aId: string;
  wavelengthId: string;
  shareToken: string;
  questionIds: string[];
}> {
  const aId = await createTestUser();
  const { id: wavelengthId, share_token: shareToken } = await asRequest(aId, async (client) => {
    const { rows } = await client.query<{ id: string; share_token: string }>(
      `insert into wavelengths (participant_a_id, source_game_id, fixed_question_count)
       values ($1, $2, $3) returning id, share_token`,
      [aId, THIRTY_SIX_QUESTIONS.id, COUNT],
    );
    return rows[0]!;
  });

  const questionIds = await asRequest(aId, async (client) => {
    const values = TEXTS.map((_, i) => `($1, 'relationship', 'open', $${i + 2}, null, ${i})`).join(
      ", ",
    );
    const { rows } = await client.query<{ id: string }>(
      `insert into questions (wavelength_id, category, type, text, options, order_index)
       values ${values} returning id`,
      [wavelengthId, ...TEXTS],
    );
    return rows.map((row) => row.id);
  });

  return { aId, wavelengthId, shareToken, questionIds };
}

async function answer(
  userId: string,
  wavelengthId: string,
  questionId: string,
  participant: "A" | "B",
  text: string,
) {
  await asRequest(userId, (client) =>
    client.query(
      `insert into answers (wavelength_id, question_id, participant, value)
       values ($1, $2, $3::participant_role, $4::jsonb)
       on conflict (question_id, participant) do update set value = excluded.value`,
      [wavelengthId, questionId, participant, JSON.stringify(text)],
    ),
  );
}

async function answerAllWritten(
  userId: string,
  wavelengthId: string,
  questionIds: string[],
  participant: "A" | "B",
) {
  for (const [i, id] of questionIds.entries()) {
    await answer(userId, wavelengthId, id, participant, `${participant} answer ${i + 1}`);
  }
}

async function readAnswers(userId: string, wavelengthId: string) {
  return asRequest(userId, async (client) => {
    const { rows } = await client.query<{ participant: "A" | "B"; value: string }>(
      "select participant, value from answers where wavelength_id = $1",
      [wavelengthId],
    );
    return rows;
  });
}

describe("fixed conversation experience: seeding", () => {
  it("seeds exactly 36 open questions, 12 + 12 + 12, in the defined order", async () => {
    const { aId, wavelengthId } = await seedConversation();
    const rows = await asRequest(aId, async (client) => {
      const { rows } = await client.query<{ text: string; type: string; order_index: number }>(
        "select text, type, order_index from questions where wavelength_id = $1 order by order_index",
        [wavelengthId],
      );
      return rows;
    });
    expect(rows).toHaveLength(36);
    expect(rows.map((row) => row.text)).toEqual(TEXTS);
    expect(new Set(rows.map((row) => row.type))).toEqual(new Set(["open"]));
    expect(THIRTY_SIX_QUESTIONS.stages.map((stage) => stage.questions.length)).toEqual([
      12, 12, 12,
    ]);
  });

  it("refuses a 37th question", async () => {
    const { aId, wavelengthId } = await seedConversation();
    await expect(
      asRequest(aId, (client) =>
        client.query(
          `insert into questions (wavelength_id, category, type, text, options, order_index)
           values ($1, 'relationship', 'open', 'One more question?', null, 36)`,
          [wavelengthId],
        ),
      ),
    ).rejects.toThrow(/fixed set of 36 questions/);
  });

  it("rejects an out-of-range fixed_question_count", async () => {
    const aId = await createTestUser();
    await expect(
      asRequest(aId, (client) =>
        client.query(
          "insert into wavelengths (participant_a_id, fixed_question_count) values ($1, 500)",
          [aId],
        ),
      ),
    ).rejects.toThrow();
  });
});

describe("fixed conversation experience: the question set is immutable", () => {
  it("A cannot edit, delete, or reorder a question, even while DRAFT", async () => {
    const { aId, wavelengthId, questionIds } = await seedConversation();
    const first = questionIds[0]!;

    await expect(
      asRequest(aId, (client) =>
        client.query("update questions set text = 'Replaced question' where id = $1", [first]),
      ),
    ).rejects.toThrow(/fixed/);
    await expect(
      asRequest(aId, (client) => client.query("delete from questions where id = $1", [first])),
    ).rejects.toThrow(/fixed/);
    await expect(
      asRequest(aId, (client) =>
        client.query("select reorder_questions($1, $2)", [
          wavelengthId,
          [...questionIds].reverse(),
        ]),
      ),
    ).rejects.toThrow(/fixed/);

    const texts = await asRequest(aId, async (client) => {
      const { rows } = await client.query<{ text: string }>(
        "select text from questions where wavelength_id = $1 order by order_index",
        [wavelengthId],
      );
      return rows.map((row) => row.text);
    });
    expect(texts).toEqual(TEXTS);
  });

  it("fixed_question_count can never be changed, even bypassing RLS", async () => {
    const { wavelengthId } = await seedConversation();
    await expect(
      asAdmin((client) =>
        client.query("update wavelengths set fixed_question_count = null where id = $1", [
          wavelengthId,
        ]),
      ),
    ).rejects.toThrow(/fixed_question_count cannot be changed/);
  });
});

describe("open questions stay out of standard questionnaires", () => {
  it("a standard draft cannot get an open question, by insert or by type change", async () => {
    const { aId, wavelengthId } = await createDraft();
    await expect(
      asRequest(aId, (client) =>
        client.query(
          `insert into questions (wavelength_id, category, type, text, options, order_index)
           values ($1, 'relationship', 'open', 'Sneaky open question', null, 0)`,
          [wavelengthId],
        ),
      ),
    ).rejects.toThrow(/only available in fixed conversation experiences/);

    const [question] = await addQuestions(aId, wavelengthId, 1);
    await expect(
      asRequest(aId, (client) =>
        client.query("update questions set type = 'open', options = null where id = $1", [
          question!.id,
        ]),
      ),
    ).rejects.toThrow(/only available in fixed conversation experiences/);
  });

  it("a standard draft is still capped at 12 questions and still editable", async () => {
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId, 12);
    await expect(addQuestions(aId, wavelengthId, 1)).rejects.toThrow(/at most 12 questions/);
    await asRequest(aId, (client) =>
      client.query("update questions set text = 'Still editable' where id = $1", [
        questions[0]!.id,
      ]),
    );
  });
});

describe("fixed conversation experience: written answers", () => {
  it("stores trimmed-non-empty text and rejects empty, oversized, or numeric answers", async () => {
    const { aId, wavelengthId, questionIds } = await seedConversation();
    const q = questionIds[0]!;

    await answer(aId, wavelengthId, q, "A", "A long walk and a good coffee.\nThen more coffee.");
    await expect(answer(aId, wavelengthId, q, "A", "   ")).rejects.toThrow(/1-2000/);
    await expect(answer(aId, wavelengthId, q, "A", "x".repeat(2001))).rejects.toThrow(/1-2000/);
    await expect(answer(aId, wavelengthId, q, "A", "bell\u0007")).rejects.toThrow(
      /control characters/,
    );
    await expect(
      asRequest(aId, (client) =>
        client.query(
          `insert into answers (wavelength_id, question_id, participant, value)
           values ($1, $2, 'A', '3'::jsonb)
           on conflict (question_id, participant) do update set value = excluded.value`,
          [wavelengthId, q],
        ),
      ),
    ).rejects.toThrow(/JSON string/);

    const rows = await readAnswers(aId, wavelengthId);
    expect(rows).toEqual([
      { participant: "A", value: "A long walk and a good coffee.\nThen more coffee." },
    ]);
  });

  it("A cannot finalize until every one of the 36 questions is answered", async () => {
    const { aId, wavelengthId, questionIds } = await seedConversation();
    await answerAllWritten(aId, wavelengthId, questionIds.slice(0, 35), "A");
    await expect(finalizeAsA(aId, wavelengthId)).rejects.toThrow(/not answered all questions/);
    await answer(aId, wavelengthId, questionIds[35]!, "A", "Last one.");
    await finalizeAsA(aId, wavelengthId);
  });
});

describe("fixed conversation experience: two participants, end to end", () => {
  it("keeps each side private until COMPLETED, then shows both to both", async () => {
    const { aId, wavelengthId, shareToken, questionIds } = await seedConversation();
    await answerAllWritten(aId, wavelengthId, questionIds, "A");
    await finalizeAsA(aId, wavelengthId, "Alex");

    // The share link's pre-claim preview never carries answers.
    const preview = await asRequest(null, async (client) => {
      const { rows } = await client.query("select * from get_wavelength_preview($1)", [shareToken]);
      return rows;
    });
    expect(preview).toEqual([{ state: "WAITING", participant_a_alias: "Alex", is_taken: false }]);

    const bId = await createTestUser();
    await claimAsB(bId, shareToken, "Bailey");

    // B sees the same 36 questions in the same order…
    const bQuestions = await asRequest(bId, async (client) => {
      const { rows } = await client.query<{ text: string }>(
        "select text from questions where wavelength_id = $1 order by order_index",
        [wavelengthId],
      );
      return rows.map((row) => row.text);
    });
    expect(bQuestions).toEqual(TEXTS);

    // …but none of A's answers, and A sees none of B's partial progress.
    expect(await readAnswers(bId, wavelengthId)).toHaveLength(0);
    await answerAllWritten(bId, wavelengthId, questionIds.slice(0, 10), "B");
    expect((await readAnswers(aId, wavelengthId)).every((row) => row.participant === "A")).toBe(
      true,
    );
    expect((await readAnswers(bId, wavelengthId)).every((row) => row.participant === "B")).toBe(
      true,
    );

    // B can't change the question set either.
    await expect(
      asRequest(bId, (client) =>
        client.query("delete from questions where id = $1 returning id", [questionIds[0]]),
      ),
    ).resolves.toMatchObject({ rowCount: 0 });

    await expect(submitFinalB(bId, wavelengthId)).rejects.toThrow(/not answered all questions/);
    await answerAllWritten(bId, wavelengthId, questionIds.slice(10), "B");
    await submitFinalB(bId, wavelengthId);

    for (const viewer of [aId, bId]) {
      const rows = await readAnswers(viewer, wavelengthId);
      expect(rows.filter((row) => row.participant === "A")).toHaveLength(36);
      expect(rows.filter((row) => row.participant === "B")).toHaveLength(36);
    }

    // A stranger with the link still reads nothing.
    const stranger = await createTestUser();
    expect(await readAnswers(stranger, wavelengthId)).toHaveLength(0);

    // Locked after completion.
    await expect(
      answer(bId, wavelengthId, questionIds[0]!, "B", "Changed my mind"),
    ).rejects.toThrow();
  });
});
