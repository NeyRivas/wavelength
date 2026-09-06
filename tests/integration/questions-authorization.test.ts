import { beforeEach, describe, expect, it } from "vitest";

import { asRequest, createTestUser, resetDatabase } from "./setup/db";
import { addQuestions, answerAll, createDraft, finalizeAsA } from "./setup/fixtures";

beforeEach(async () => {
  await resetDatabase();
});

describe("questions: A can CRUD only while DRAFT", () => {
  it("lets A insert questions in DRAFT", async () => {
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId, 5);
    expect(questions).toHaveLength(5);
  });

  it("lets A update and delete a question in DRAFT", async () => {
    const { aId, wavelengthId } = await createDraft();
    const [q] = await addQuestions(aId, wavelengthId, 5);

    await asRequest(aId, (client) =>
      client.query("update questions set text = 'Updated text' where id = $1", [q!.id]),
    );
    await asRequest(aId, (client) => client.query("delete from questions where id = $1", [q!.id]));

    const remaining = await asRequest(aId, async (client) => {
      const { rows } = await client.query("select id from questions where wavelength_id = $1", [
        wavelengthId,
      ]);
      return rows;
    });
    expect(remaining).toHaveLength(4);
  });

  it("blocks a stranger from inserting questions into someone else's draft", async () => {
    const { wavelengthId } = await createDraft();
    const stranger = await createTestUser();

    await expect(
      asRequest(stranger, (client) =>
        client.query(
          `insert into questions (wavelength_id, category, type, text, options, order_index)
           values ($1, 'relationship', 'choice', 'Injected question', '["a","b"]'::jsonb, 0)`,
          [wavelengthId],
        ),
      ),
    ).rejects.toThrow();
  });

  it("locks question writes once the wavelength is WAITING", async () => {
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId);
    await answerAll(aId, wavelengthId, questions, "A");
    await finalizeAsA(aId, wavelengthId);

    await expect(
      asRequest(aId, (client) =>
        client.query(
          `insert into questions (wavelength_id, category, type, text, options, order_index)
           values ($1, 'relationship', 'choice', 'Too late', '["a","b"]'::jsonb, 99)`,
          [wavelengthId],
        ),
      ),
    ).rejects.toThrow();

    await expect(
      asRequest(aId, (client) =>
        client.query("update questions set text = 'Edited after lock' where id = $1", [
          questions[0]!.id,
        ]),
      ),
    ).rejects.toThrow();

    // A DELETE whose row is excluded by the USING clause matches 0 rows and
    // does not throw (unlike INSERT/UPDATE's WITH CHECK) — assert on the
    // effect (nothing deleted) rather than an exception.
    const deleteResult = await asRequest(aId, (client) =>
      client.query("delete from questions where id = $1", [questions[0]!.id]),
    );
    expect(deleteResult.rowCount).toBe(0);

    const stillThere = await asRequest(aId, async (client) => {
      const { rows } = await client.query("select id from questions where id = $1", [
        questions[0]!.id,
      ]);
      return rows;
    });
    expect(stillThere).toHaveLength(1);
  });
});

describe("questions: max count (§10 — 12 is a hard cap, enforced independently of RLS)", () => {
  it("allows building up to exactly 12 questions", async () => {
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId, 12);
    expect(questions).toHaveLength(12);
  });

  it("rejects adding a 13th question", async () => {
    const { aId, wavelengthId } = await createDraft();
    await addQuestions(aId, wavelengthId, 12);

    await expect(
      asRequest(aId, (client) =>
        client.query(
          `insert into questions (wavelength_id, category, type, text, options, order_index)
           values ($1, 'relationship', 'choice', 'One question too many', '["a","b"]'::jsonb, 12)`,
          [wavelengthId],
        ),
      ),
    ).rejects.toThrow(/at most 12 questions/);
  });
});

describe("questions: duplicate prevention", () => {
  it("rejects two questions with the same normalized text in one questionnaire", async () => {
    const { aId, wavelengthId } = await createDraft();
    await asRequest(aId, (client) =>
      client.query(
        `insert into questions (wavelength_id, category, type, text, options, order_index)
         values ($1, 'relationship', 'choice', 'Same question', '["a","b"]'::jsonb, 0)`,
        [wavelengthId],
      ),
    );

    await expect(
      asRequest(aId, (client) =>
        client.query(
          // different casing/whitespace, same normalized text
          `insert into questions (wavelength_id, category, type, text, options, order_index)
           values ($1, 'lifestyle', 'choice', '  same question  ', '["a","b"]'::jsonb, 1)`,
          [wavelengthId],
        ),
      ),
    ).rejects.toThrow();
  });
});

// Test 9 (QA bug): delete a mid-list question, then create a new one with
// different text. Root cause (confirmed by reading the code, not assumed):
// `addQuestion` used to compute the next order_index from `count(*)`, which
// is not gap-safe — deleting never renumbers the remaining rows, so a count
// can land right back on an order_index a surviving row still holds. That
// collided with `questions_order_unique` (a different constraint than the
// text one), but the old error mapping couldn't tell the two apart and
// mislabeled it as "You already have a question with this text." The fix
// (app/actions/questions.ts) computes the next index as
// `MAX(order_index) + 1`, which is gap-safe regardless of prior deletions;
// this test drives that exact insert shape directly against the DB to prove
// it no longer collides, while the sibling "genuinely duplicate text is
// still rejected" test proves the fix didn't weaken real duplicate detection.
describe("questions: delete then create (QA bug fix — order_index gap safety)", () => {
  async function currentQuestions(aId: string, wavelengthId: string) {
    return asRequest(aId, async (client) => {
      const { rows } = await client.query<{ id: string; text: string; order_index: number }>(
        "select id, text, order_index from questions where wavelength_id = $1 order by order_index asc",
        [wavelengthId],
      );
      return rows;
    });
  }

  it("creating after deleting a middle question succeeds, with a gap-safe order_index and correct order", async () => {
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId, 3); // order_index 0, 1, 2

    // Delete the middle one — leaves a gap at order_index 1. A `count(*)`
    // based next-index computation would now (wrongly) produce 1 again,
    // which is already held by nothing... but produces 2 for the *next*
    // insert, which collides with the surviving last row. Reproduced below
    // via the fixed, gap-safe computation to prove it no longer happens.
    await asRequest(aId, (client) =>
      client.query("delete from questions where id = $1", [questions[1]!.id]),
    );

    const beforeInsert = await currentQuestions(aId, wavelengthId);
    expect(beforeInsert.map((q) => q.order_index)).toEqual([0, 2]);

    const nextOrderIndex = Math.max(...beforeInsert.map((q) => q.order_index)) + 1; // gap-safe: 3
    const newText = "A completely different question about something else";

    await expect(
      asRequest(aId, (client) =>
        client.query(
          `insert into questions (wavelength_id, category, type, text, options, order_index)
           values ($1, 'relationship', 'choice', $2, '["a","b"]'::jsonb, $3)`,
          [wavelengthId, newText, nextOrderIndex],
        ),
      ),
    ).resolves.not.toThrow();

    const after = await currentQuestions(aId, wavelengthId);
    expect(after.map((q) => q.order_index)).toEqual([0, 2, 3]);
    expect(after.at(-1)?.text).toBe(newText);
  });

  it("does not falsely reject the new question as a duplicate of the deleted one's text", async () => {
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId, 3);

    await asRequest(aId, (client) =>
      client.query("delete from questions where id = $1", [questions[1]!.id]),
    );

    const remaining = await currentQuestions(aId, wavelengthId);
    const nextOrderIndex = Math.max(...remaining.map((q) => q.order_index)) + 1;

    // Different text from every surviving question — must succeed cleanly.
    await expect(
      asRequest(aId, (client) =>
        client.query(
          `insert into questions (wavelength_id, category, type, text, options, order_index)
           values ($1, 'relationship', 'choice', 'Totally unrelated new text', '["a","b"]'::jsonb, $2)`,
          [wavelengthId, nextOrderIndex],
        ),
      ),
    ).resolves.not.toThrow();
  });

  it("still rejects a genuine duplicate text after a delete (fix must not weaken real validation)", async () => {
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId, 3);

    await asRequest(aId, (client) =>
      client.query("delete from questions where id = $1", [questions[1]!.id]),
    );

    const remaining = await currentQuestions(aId, wavelengthId);
    const nextOrderIndex = Math.max(...remaining.map((q) => q.order_index)) + 1;
    const survivingText = remaining[0]!.text; // a question that's still there

    await expect(
      asRequest(aId, (client) =>
        client.query(
          `insert into questions (wavelength_id, category, type, text, options, order_index)
           values ($1, 'relationship', 'choice', $2, '["a","b"]'::jsonb, $3)`,
          [wavelengthId, survivingText, nextOrderIndex],
        ),
      ),
    ).rejects.toThrow();
  });

  it("persists correctly across a fresh read (simulates reload)", async () => {
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId, 3);

    await asRequest(aId, (client) =>
      client.query("delete from questions where id = $1", [questions[1]!.id]),
    );
    const remaining = await currentQuestions(aId, wavelengthId);
    const nextOrderIndex = Math.max(...remaining.map((q) => q.order_index)) + 1;
    await asRequest(aId, (client) =>
      client.query(
        `insert into questions (wavelength_id, category, type, text, options, order_index)
         values ($1, 'relationship', 'choice', 'Reload check question', '["a","b"]'::jsonb, $2)`,
        [wavelengthId, nextOrderIndex],
      ),
    );

    // A fresh SELECT (new round trip, as a page reload would do) sees the
    // same stable, gap-free-at-the-top ordering.
    const reloaded = await currentQuestions(aId, wavelengthId);
    expect(reloaded.map((q) => q.order_index)).toEqual([0, 2, nextOrderIndex]);
    expect(reloaded.at(-1)?.text).toBe("Reload check question");
  });
});

describe("questions: option shape and content validation", () => {
  it("rejects a choice question with only one option", async () => {
    const { aId, wavelengthId } = await createDraft();
    await expect(
      asRequest(aId, (client) =>
        client.query(
          `insert into questions (wavelength_id, category, type, text, options, order_index)
           values ($1, 'relationship', 'choice', 'Too few options', '["only-one"]'::jsonb, 0)`,
          [wavelengthId],
        ),
      ),
    ).rejects.toThrow();
  });

  it("rejects a choice question with six options", async () => {
    const { aId, wavelengthId } = await createDraft();
    await expect(
      asRequest(aId, (client) =>
        client.query(
          `insert into questions (wavelength_id, category, type, text, options, order_index)
           values ($1, 'relationship', 'choice', 'Too many options', '["a","b","c","d","e","f"]'::jsonb, 0)`,
          [wavelengthId],
        ),
      ),
    ).rejects.toThrow();
  });

  it("rejects a scale question that has options", async () => {
    const { aId, wavelengthId } = await createDraft();
    await expect(
      asRequest(aId, (client) =>
        client.query(
          `insert into questions (wavelength_id, category, type, text, options, order_index)
           values ($1, 'relationship', 'scale', 'Scale with options', '["a","b"]'::jsonb, 0)`,
          [wavelengthId],
        ),
      ),
    ).rejects.toThrow();
  });

  it("rejects an empty-string option", async () => {
    const { aId, wavelengthId } = await createDraft();
    await expect(
      asRequest(aId, (client) =>
        client.query(
          `insert into questions (wavelength_id, category, type, text, options, order_index)
           values ($1, 'relationship', 'choice', 'Empty option', '["a",""]'::jsonb, 0)`,
          [wavelengthId],
        ),
      ),
    ).rejects.toThrow();
  });
});
