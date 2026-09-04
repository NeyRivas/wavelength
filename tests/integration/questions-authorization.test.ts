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
