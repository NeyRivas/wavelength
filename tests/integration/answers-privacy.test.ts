import { beforeEach, describe, expect, it } from "vitest";

import { asRequest, createTestUser, resetDatabase } from "./setup/db";
import {
  addQuestions,
  answerAll,
  claimAsB,
  createCompletedWavelength,
  createDraft,
  finalizeAsA,
} from "./setup/fixtures";

beforeEach(async () => {
  await resetDatabase();
});

async function selectAnswers(userId: string, wavelengthId: string) {
  return asRequest(userId, async (client) => {
    const { rows } = await client.query(
      "select participant, question_id, value from answers where wavelength_id = $1",
      [wavelengthId],
    );
    return rows;
  });
}

describe("answers: the core privacy rule (ARCHITECTURE.md §4-5)", () => {
  it("B cannot read A's answers before COMPLETED — empty result, not an error", async () => {
    const { aId, wavelengthId, shareToken } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId);
    await answerAll(aId, wavelengthId, questions, "A");
    await finalizeAsA(aId, wavelengthId);

    const bId = await createTestUser();
    await claimAsB(bId, shareToken); // now IN_PROGRESS

    const visibleToB = await selectAnswers(bId, wavelengthId);
    expect(visibleToB).toHaveLength(0);
  });

  it("A cannot read B's in-progress answers or infer their count", async () => {
    const { aId, wavelengthId, shareToken } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId);
    await answerAll(aId, wavelengthId, questions, "A");
    await finalizeAsA(aId, wavelengthId);

    const bId = await createTestUser();
    await claimAsB(bId, shareToken);
    // B answers only 2 of the questions (partial progress).
    await answerAll(bId, wavelengthId, questions.slice(0, 2), "B");

    const visibleToA = await asRequest(aId, async (client) => {
      const { rows } = await client.query(
        "select * from answers where wavelength_id = $1 and participant = 'B'",
        [wavelengthId],
      );
      return rows;
    });
    expect(visibleToA).toHaveLength(0);
  });

  it("each participant can always read their own answers", async () => {
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId);
    await answerAll(aId, wavelengthId, questions, "A");

    const own = await selectAnswers(aId, wavelengthId);
    expect(own).toHaveLength(questions.length);
  });

  it("a stranger (never claimed, not A) can read nothing at all", async () => {
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId);
    await answerAll(aId, wavelengthId, questions, "A");
    await finalizeAsA(aId, wavelengthId);

    const stranger = await createTestUser();
    const visible = await selectAnswers(stranger, wavelengthId);
    expect(visible).toHaveLength(0);
  });

  it("once COMPLETED, both A and B can read both sides' answers", async () => {
    const { aId, bId, wavelengthId, questions } = await createCompletedWavelength();

    const visibleToA = await selectAnswers(aId, wavelengthId);
    const visibleToB = await selectAnswers(bId, wavelengthId);

    expect(visibleToA).toHaveLength(questions.length * 2);
    expect(visibleToB).toHaveLength(questions.length * 2);
  });
});

describe("answers: write locking", () => {
  it("A cannot write answers once WAITING (locked)", async () => {
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId);
    await answerAll(aId, wavelengthId, questions, "A");
    await finalizeAsA(aId, wavelengthId);

    await expect(
      asRequest(aId, (client) =>
        client.query(
          `insert into answers (wavelength_id, question_id, participant, value)
           values ($1, $2, 'A', '0'::jsonb)
           on conflict (question_id, participant) do update set value = excluded.value`,
          [wavelengthId, questions[0]!.id],
        ),
      ),
    ).rejects.toThrow();
  });

  it("B cannot write answers before claiming (still WAITING)", async () => {
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId);
    await answerAll(aId, wavelengthId, questions, "A");
    await finalizeAsA(aId, wavelengthId);

    const bId = await createTestUser(); // never claims
    await expect(
      asRequest(bId, (client) =>
        client.query(
          `insert into answers (wavelength_id, question_id, participant, value)
           values ($1, $2, 'B', '0'::jsonb)`,
          [wavelengthId, questions[0]!.id],
        ),
      ),
    ).rejects.toThrow();
  });

  it("B cannot impersonate A by inserting a participant='A' row", async () => {
    const { aId, wavelengthId, shareToken } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId);
    await answerAll(aId, wavelengthId, questions, "A");
    await finalizeAsA(aId, wavelengthId);

    const bId = await createTestUser();
    await claimAsB(bId, shareToken);

    await expect(
      asRequest(bId, (client) =>
        client.query(
          `insert into answers (wavelength_id, question_id, participant, value)
           values ($1, $2, 'A', '1'::jsonb)
           on conflict (question_id, participant) do update set value = excluded.value`,
          [wavelengthId, questions[0]!.id],
        ),
      ),
    ).rejects.toThrow();
  });

  it("neither participant can write answers once COMPLETED", async () => {
    const { aId, bId, wavelengthId, questions } = await createCompletedWavelength();

    await expect(
      asRequest(aId, (client) =>
        client.query(
          `insert into answers (wavelength_id, question_id, participant, value)
           values ($1, $2, 'A', '0'::jsonb)
           on conflict (question_id, participant) do update set value = excluded.value`,
          [wavelengthId, questions[0]!.id],
        ),
      ),
    ).rejects.toThrow();

    await expect(
      asRequest(bId, (client) =>
        client.query(
          `insert into answers (wavelength_id, question_id, participant, value)
           values ($1, $2, 'B', '0'::jsonb)
           on conflict (question_id, participant) do update set value = excluded.value`,
          [wavelengthId, questions[0]!.id],
        ),
      ),
    ).rejects.toThrow();
  });

  it("lets B go back and change an answer while IN_PROGRESS", async () => {
    const { aId, wavelengthId, shareToken } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId);
    await answerAll(aId, wavelengthId, questions, "A");
    await finalizeAsA(aId, wavelengthId);

    const bId = await createTestUser();
    await claimAsB(bId, shareToken);
    await answerAll(bId, wavelengthId, questions, "B");

    await asRequest(bId, (client) =>
      client.query(
        `insert into answers (wavelength_id, question_id, participant, value)
         values ($1, $2, 'B', '1'::jsonb)
         on conflict (question_id, participant) do update set value = excluded.value`,
        [wavelengthId, questions[0]!.id],
      ),
    );

    const rows = await asRequest(bId, async (client) => {
      const { rows } = await client.query(
        "select value from answers where wavelength_id = $1 and question_id = $2 and participant = 'B'",
        [wavelengthId, questions[0]!.id],
      );
      return rows;
    });
    expect(rows[0]!.value).toBe(1);
  });
});

describe("answers: value validation", () => {
  it("rejects an out-of-range option index for a choice question", async () => {
    const { aId, wavelengthId } = await createDraft();
    const [q] = await addQuestions(aId, wavelengthId, 1); // 'choice' type, 2 options

    await expect(
      asRequest(aId, (client) =>
        client.query(
          `insert into answers (wavelength_id, question_id, participant, value)
           values ($1, $2, 'A', '5'::jsonb)`,
          [wavelengthId, q!.id],
        ),
      ),
    ).rejects.toThrow();
  });

  it("rejects a scale value outside 1-5", async () => {
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId, 2); // question #1 is 'scale'
    const scaleQuestion = questions[1]!;

    await expect(
      asRequest(aId, (client) =>
        client.query(
          `insert into answers (wavelength_id, question_id, participant, value)
           values ($1, $2, 'A', '0'::jsonb)`,
          [wavelengthId, scaleQuestion.id],
        ),
      ),
    ).rejects.toThrow();

    await expect(
      asRequest(aId, (client) =>
        client.query(
          `insert into answers (wavelength_id, question_id, participant, value)
           values ($1, $2, 'A', '6'::jsonb)`,
          [wavelengthId, scaleQuestion.id],
        ),
      ),
    ).rejects.toThrow();
  });
});
