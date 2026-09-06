import { beforeEach, describe, expect, it } from "vitest";

import { asRequest, resetDatabase } from "./setup/db";
import { addQuestions, createDraft } from "./setup/fixtures";

beforeEach(async () => {
  await resetDatabase();
});

describe("question editing: category is immutable after creation", () => {
  it("rejects changing a question's category", async () => {
    const { aId, wavelengthId } = await createDraft();
    const [q] = await addQuestions(aId, wavelengthId, 1);

    await expect(
      asRequest(aId, (client) =>
        client.query("update questions set category = 'money' where id = $1", [q!.id]),
      ),
    ).rejects.toThrow(/category cannot be changed/);
  });

  it("still allows updating other fields (text, options) on the same row", async () => {
    const { aId, wavelengthId } = await createDraft();
    const [q] = await addQuestions(aId, wavelengthId, 1);

    await asRequest(aId, (client) =>
      client.query("update questions set text = 'A brand new phrasing' where id = $1", [q!.id]),
    );

    const rows = await asRequest(aId, async (client) => {
      const { rows } = await client.query("select text from questions where id = $1", [q!.id]);
      return rows;
    });
    expect(rows[0]?.text).toBe("A brand new phrasing");
  });

  it("an UPDATE that sets category to the same value it already had is not rejected", async () => {
    const { aId, wavelengthId } = await createDraft();
    const [q] = await addQuestions(aId, wavelengthId, 1); // category: relationship

    await expect(
      asRequest(aId, (client) =>
        client.query("update questions set category = 'relationship' where id = $1", [q!.id]),
      ),
    ).resolves.not.toThrow();
  });
});

describe("question editing: type change replaces options appropriately", () => {
  it("switching choice -> scale clears options", async () => {
    const { aId, wavelengthId } = await createDraft();
    const [q] = await addQuestions(aId, wavelengthId, 1); // choice, 2 options

    await asRequest(aId, (client) =>
      client.query("update questions set type = 'scale', options = null where id = $1", [q!.id]),
    );

    const rows = await asRequest(aId, async (client) => {
      const { rows } = await client.query("select type, options from questions where id = $1", [
        q!.id,
      ]);
      return rows;
    });
    expect(rows[0]).toEqual({ type: "scale", options: null });
  });

  it("switching scale -> choice requires supplying options (can't leave them null)", async () => {
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId, 2);
    const scaleQuestion = questions[1]!; // type: scale

    await expect(
      asRequest(aId, (client) =>
        client.query("update questions set type = 'choice' where id = $1", [scaleQuestion.id]),
      ),
    ).rejects.toThrow(/options_shape/);
  });

  it("switching scale -> choice with fresh options succeeds", async () => {
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId, 2);
    const scaleQuestion = questions[1]!;

    await asRequest(aId, (client) =>
      client.query(
        `update questions set type = 'choice', options = '["Option 1","Option 2"]'::jsonb where id = $1`,
        [scaleQuestion.id],
      ),
    );

    const rows = await asRequest(aId, async (client) => {
      const { rows } = await client.query("select type, options from questions where id = $1", [
        scaleQuestion.id,
      ]);
      return rows;
    });
    expect(rows[0]?.type).toBe("choice");
    expect(rows[0]?.options).toEqual(["Option 1", "Option 2"]);
  });

  it("rejects 'situation' as a question type — removed from the MVP", async () => {
    const { aId, wavelengthId } = await createDraft();
    const [q] = await addQuestions(aId, wavelengthId, 1); // choice, ["Stay in", "Go out"]

    await expect(
      asRequest(aId, (client) =>
        client.query("update questions set type = 'situation' where id = $1", [q!.id]),
      ),
    ).rejects.toThrow(/invalid input value for enum/);
  });
});

// Test 8 (QA): "Remove option" must target one specific option, not always
// the last one. The UI (components/questionnaire/question-edit-form.tsx)
// now tracks each option as its own slot and submits the full resulting
// array with exactly the removed one missing — this is what that submitted
// UPDATE looks like at the DB layer: the other options must survive
// untouched, in their original relative order.
describe("question editing: removing one specific option (QA fix)", () => {
  it("removing the middle of 3 options leaves the first and third, in order", async () => {
    const { aId, wavelengthId } = await createDraft();
    const qId = await asRequest(aId, async (client) => {
      const { rows } = await client.query<{ id: string }>(
        `insert into questions (wavelength_id, category, type, text, options, order_index)
         values ($1, 'relationship', 'choice', 'Favorite season?', '["Alpha","Beta","Gamma"]'::jsonb, 0)
         returning id`,
        [wavelengthId],
      );
      return rows[0]!.id;
    });

    // Simulates the form submitting every surviving option after "Beta"
    // (index 1) was removed — Alpha and Gamma, in their original order.
    await asRequest(aId, (client) =>
      client.query(`update questions set options = '["Alpha","Gamma"]'::jsonb where id = $1`, [
        qId,
      ]),
    );

    const rows = await asRequest(aId, async (client) => {
      const { rows } = await client.query("select options from questions where id = $1", [qId]);
      return rows;
    });
    expect(rows[0]?.options).toEqual(["Alpha", "Gamma"]);
  });

  it("removing the first of 3 options leaves the second and third, in order", async () => {
    const { aId, wavelengthId } = await createDraft();
    const qId = await asRequest(aId, async (client) => {
      const { rows } = await client.query<{ id: string }>(
        `insert into questions (wavelength_id, category, type, text, options, order_index)
         values ($1, 'relationship', 'choice', 'Favorite season?', '["Alpha","Beta","Gamma"]'::jsonb, 0)
         returning id`,
        [wavelengthId],
      );
      return rows[0]!.id;
    });

    await asRequest(aId, (client) =>
      client.query(`update questions set options = '["Beta","Gamma"]'::jsonb where id = $1`, [qId]),
    );

    const rows = await asRequest(aId, async (client) => {
      const { rows } = await client.query("select options from questions where id = $1", [qId]);
      return rows;
    });
    expect(rows[0]?.options).toEqual(["Beta", "Gamma"]);
  });
});
