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

  it("switching choice -> situation preserves existing options unchanged", async () => {
    const { aId, wavelengthId } = await createDraft();
    const [q] = await addQuestions(aId, wavelengthId, 1); // choice, ["Stay in", "Go out"]

    await asRequest(aId, (client) =>
      client.query("update questions set type = 'situation' where id = $1", [q!.id]),
    );

    const rows = await asRequest(aId, async (client) => {
      const { rows } = await client.query("select type, options from questions where id = $1", [
        q!.id,
      ]);
      return rows;
    });
    expect(rows[0]?.type).toBe("situation");
    expect(rows[0]?.options).toEqual(["Stay in", "Go out"]);
  });
});
