import { beforeEach, describe, expect, it } from "vitest";

import { asRequest, createTestUser, randomUserId, resetDatabase } from "./setup/db";
import { createDraft, finalizeAsA, addQuestions, answerAll } from "./setup/fixtures";

beforeEach(async () => {
  await resetDatabase();
});

describe("wavelengths: creation (RLS insert policy)", () => {
  it("lets A create their own draft", async () => {
    const { wavelengthId } = await createDraft();
    expect(wavelengthId).toBeTruthy();
  });

  it("rejects creating a draft with a spoofed participant_a_id", async () => {
    const aId = await createTestUser();
    const someoneElse = randomUserId();

    await expect(
      asRequest(aId, (client) =>
        client.query(
          `insert into wavelengths (participant_a_id, question_count, categories)
           values ($1, 5, '{relationship}'::wavelength_category[])`,
          [someoneElse],
        ),
      ),
    ).rejects.toThrow();
  });

  it("rejects a fully anonymous (unauthenticated) insert attempt", async () => {
    await expect(
      asRequest(null, (client) =>
        client.query(
          `insert into wavelengths (participant_a_id, question_count, categories)
           values ($1, 5, '{relationship}'::wavelength_category[])`,
          [randomUserId()],
        ),
      ),
    ).rejects.toThrow();
  });

  it("rejects selecting more categories than the question count allows (resolved decision §13.A)", async () => {
    const aId = await createTestUser();
    await expect(
      asRequest(aId, (client) =>
        client.query(
          `insert into wavelengths (participant_a_id, question_count, categories)
           values ($1, 5, '{relationship,lifestyle,money,future,values_priorities,adventures_travel}'::wavelength_category[])`,
          [aId],
        ),
      ),
    ).rejects.toThrow(/categories_capped_by_question_count/);
  });

  it("rejects a question_count outside 5-12", async () => {
    const aId = await createTestUser();
    await expect(
      asRequest(aId, (client) =>
        client.query(
          `insert into wavelengths (participant_a_id, question_count, categories)
           values ($1, 4, '{relationship}'::wavelength_category[])`,
          [aId],
        ),
      ),
    ).rejects.toThrow();
  });
});

describe("wavelengths: no enumeration / no direct read for non-participants", () => {
  it("a non-participant gets zero rows from a direct SELECT, even once WAITING", async () => {
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId);
    await answerAll(aId, wavelengthId, questions, "A");
    await finalizeAsA(aId, wavelengthId);

    const stranger = await createTestUser();
    const rows = await asRequest(stranger, async (client) => {
      const { rows } = await client.query("select * from wavelengths where id = $1", [
        wavelengthId,
      ]);
      return rows;
    });
    expect(rows).toHaveLength(0);
  });

  it("a stranger cannot list any wavelengths at all (no open SELECT)", async () => {
    await createDraft();
    const stranger = await createTestUser();
    const rows = await asRequest(stranger, async (client) => {
      const { rows } = await client.query("select * from wavelengths");
      return rows;
    });
    expect(rows).toHaveLength(0);
  });
});

describe("get_wavelength_preview (pre-claim, token-based lookup)", () => {
  it("returns nothing for a DRAFT wavelength (not shared yet)", async () => {
    const { shareToken } = await createDraft();
    const stranger = await createTestUser();

    const rows = await asRequest(stranger, async (client) => {
      const { rows } = await client.query("select * from get_wavelength_preview($1)", [shareToken]);
      return rows;
    });
    expect(rows).toHaveLength(0);
  });

  it("returns a safe, minimal projection once WAITING — no participant ids", async () => {
    const { aId, wavelengthId, shareToken } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId);
    await answerAll(aId, wavelengthId, questions, "A");
    await finalizeAsA(aId, wavelengthId, "Alex");

    const stranger = await createTestUser();
    const rows = await asRequest(stranger, async (client) => {
      const { rows } = await client.query("select * from get_wavelength_preview($1)", [shareToken]);
      return rows;
    });

    expect(rows).toHaveLength(1);
    const preview = rows[0];
    expect(preview.state).toBe("WAITING");
    expect(preview.participant_a_alias).toBe("Alex");
    expect(preview.is_taken).toBe(false);
    expect(preview).not.toHaveProperty("participant_a_id");
    expect(preview).not.toHaveProperty("participant_b_id");
  });

  it("works even for a fully anonymous (unauthenticated) visitor", async () => {
    const { aId, wavelengthId, shareToken } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId);
    await answerAll(aId, wavelengthId, questions, "A");
    await finalizeAsA(aId, wavelengthId);

    const rows = await asRequest(null, async (client) => {
      const { rows } = await client.query("select * from get_wavelength_preview($1)", [shareToken]);
      return rows;
    });
    expect(rows).toHaveLength(1);
  });
});
