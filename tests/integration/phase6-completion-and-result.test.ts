import { beforeEach, describe, expect, it } from "vitest";

import { buildWavelengthResultView, type ResultAnswerRow } from "../../lib/wavelength/result";
import { asRequest, createTestUser, resetDatabase } from "./setup/db";
import {
  addQuestions,
  answerAll,
  claimAsB,
  createCompletedWavelength,
  createDraft,
  finalizeAsA,
  submitFinalB,
  type CreatedQuestion,
} from "./setup/fixtures";

// Phase 6 adds no new DB objects — submit_final_b already existed and its
// state-transition preconditions were already proven in Phase 1's
// state-machine.test.ts (incomplete B answers rejected, wrong caller
// rejected, succeeds -> COMPLETED). This file focuses on what's new: the
// full completion -> privacy -> result-computation pipeline exercised
// end-to-end against real Postgres rows (not just the hand-built fixtures
// in tests/unit/wavelength-result.test.ts), plus duplicate-submission and
// post-completion locking specifically framed around this phase's flow.

beforeEach(async () => {
  await resetDatabase();
});

async function inProgressReadyToSubmit(): Promise<{
  aId: string;
  bId: string;
  wavelengthId: string;
  shareToken: string;
  questions: CreatedQuestion[];
}> {
  const { aId, wavelengthId, shareToken } = await createDraft();
  const questions = await addQuestions(aId, wavelengthId);
  await answerAll(aId, wavelengthId, questions, "A");
  await finalizeAsA(aId, wavelengthId);

  const bId = await createTestUser();
  await claimAsB(bId, shareToken);
  return { aId, bId, wavelengthId, shareToken, questions };
}

async function getStateAs(userId: string, wavelengthId: string): Promise<string> {
  const rows = await asRequest(userId, async (client) => {
    const { rows } = await client.query("select state from wavelengths where id = $1", [
      wavelengthId,
    ]);
    return rows;
  });
  return rows[0]?.state;
}

describe("B final submission", () => {
  it("submits successfully once every question is answered, transitioning IN_PROGRESS -> COMPLETED", async () => {
    const { aId, bId, wavelengthId, questions } = await inProgressReadyToSubmit();
    await answerAll(bId, wavelengthId, questions, "B");

    await submitFinalB(bId, wavelengthId);

    expect(await getStateAs(aId, wavelengthId)).toBe("COMPLETED");
  });

  it("rejects submission while any question is still unanswered, staying IN_PROGRESS", async () => {
    const { aId, bId, wavelengthId, questions } = await inProgressReadyToSubmit();
    await answerAll(bId, wavelengthId, questions.slice(0, questions.length - 1), "B"); // one short

    await expect(submitFinalB(bId, wavelengthId)).rejects.toThrow(/has not answered all questions/);
    expect(await getStateAs(aId, wavelengthId)).toBe("IN_PROGRESS");
  });

  it("rejects a duplicate submission", async () => {
    const { aId, bId, wavelengthId, questions } = await inProgressReadyToSubmit();
    await answerAll(bId, wavelengthId, questions, "B");
    await submitFinalB(bId, wavelengthId);

    await expect(submitFinalB(bId, wavelengthId)).rejects.toThrow(
      /not found, not owned by caller, or not in IN_PROGRESS state/,
    );
    // Still completed, not reverted or corrupted by the failed retry.
    expect(await getStateAs(aId, wavelengthId)).toBe("COMPLETED");
  });

  it("rejects A submitting on B's behalf", async () => {
    const { aId, bId, wavelengthId, questions } = await inProgressReadyToSubmit();
    await answerAll(bId, wavelengthId, questions, "B");

    await expect(
      asRequest(aId, (client) => client.query("select submit_final_b($1)", [wavelengthId])),
    ).rejects.toThrow();
    expect(await getStateAs(aId, wavelengthId)).toBe("IN_PROGRESS");
  });
});

describe("locking after completion", () => {
  it("neither participant can modify any answer once COMPLETED", async () => {
    const { aId, bId, wavelengthId, questions } = await createCompletedWavelength();
    const [qA, qB] = questions;

    await expect(
      asRequest(aId, (client) =>
        client.query(
          `insert into answers (wavelength_id, question_id, participant, value) values ($1, $2, 'A', '0'::jsonb)
           on conflict (question_id, participant) do update set value = excluded.value`,
          [wavelengthId, qA!.id],
        ),
      ),
    ).rejects.toThrow();

    await expect(
      asRequest(bId, (client) =>
        client.query(
          `insert into answers (wavelength_id, question_id, participant, value) values ($1, $2, 'B', '0'::jsonb)
           on conflict (question_id, participant) do update set value = excluded.value`,
          [wavelengthId, qB!.id],
        ),
      ),
    ).rejects.toThrow();
  });

  it("A still cannot touch the questionnaire at all once completed (already locked at WAITING, still true here)", async () => {
    const { aId, wavelengthId, questions } = await createCompletedWavelength();

    await expect(
      asRequest(aId, (client) =>
        client.query("update questions set text = 'edited after completion' where id = $1", [
          questions[0]!.id,
        ]),
      ),
    ).rejects.toThrow();
  });
});

describe("result access: privacy and authorization", () => {
  it("A can read every question and both participants' answers", async () => {
    const { aId, wavelengthId, questions } = await createCompletedWavelength();

    const rows = await asRequest(aId, async (client) => {
      const { rows } = await client.query(
        "select participant from answers where wavelength_id = $1",
        [wavelengthId],
      );
      return rows;
    });
    expect(rows).toHaveLength(questions.length * 2);
    expect(rows.filter((r) => r.participant === "A")).toHaveLength(questions.length);
    expect(rows.filter((r) => r.participant === "B")).toHaveLength(questions.length);
  });

  it("B can read every question and both participants' answers", async () => {
    const { bId, wavelengthId, questions } = await createCompletedWavelength();

    const rows = await asRequest(bId, async (client) => {
      const { rows } = await client.query(
        "select participant from answers where wavelength_id = $1",
        [wavelengthId],
      );
      return rows;
    });
    expect(rows).toHaveLength(questions.length * 2);
  });

  it("a third party holding only the share token cannot read the wavelength row, questions, or answers", async () => {
    const { wavelengthId, shareToken } = await createCompletedWavelength();
    const stranger = await createTestUser();

    const wavelengthRows = await asRequest(stranger, async (client) => {
      const { rows } = await client.query("select * from wavelengths where share_token = $1", [
        shareToken,
      ]);
      return rows;
    });
    expect(wavelengthRows).toHaveLength(0);

    const answerRows = await asRequest(stranger, async (client) => {
      const { rows } = await client.query("select * from answers where wavelength_id = $1", [
        wavelengthId,
      ]);
      return rows;
    });
    expect(answerRows).toHaveLength(0);
  });

  it("the share token's own preview function never exposes participant ids or answers, even once COMPLETED", async () => {
    const { shareToken } = await createCompletedWavelength();
    const stranger = await createTestUser();

    const preview = await asRequest(stranger, async (client) => {
      const { rows } = await client.query("select * from get_wavelength_preview($1)", [shareToken]);
      return rows[0];
    });
    expect(preview.state).toBe("COMPLETED");
    expect(preview).not.toHaveProperty("participant_a_id");
    expect(preview).not.toHaveProperty("participant_b_id");
    expect(Object.keys(preview)).not.toContain("value");
  });
});

describe("end-to-end result computation from real Postgres data", () => {
  it("produces the correct global score, category order, top-3, and differences from actual stored rows", async () => {
    // Explicit, hand-chosen answer values (not the generic answerAll
    // fixture) so every question's score is known ahead of time.
    const { aId, wavelengthId, shareToken } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId, 5);
    const [q0, q1, q2, q3, q4] = questions;

    await asRequest(aId, (client) =>
      client.query(
        `insert into answers (wavelength_id, question_id, participant, value) values
           ($1, $2, 'A', '0'::jsonb),
           ($1, $3, 'A', '50'::jsonb),
           ($1, $4, 'A', '0'::jsonb),
           ($1, $5, 'A', '1'::jsonb),
           ($1, $6, 'A', '25'::jsonb)`,
        [wavelengthId, q0!.id, q1!.id, q2!.id, q3!.id, q4!.id],
      ),
    );
    await finalizeAsA(aId, wavelengthId);

    const bId = await createTestUser();
    await claimAsB(bId, shareToken);

    // B's answers, chosen against A's to produce: q0=100, q1=100 (scale
    // diff 0), q2=0 (different choice), q3=0 (different choice), q4=50
    // (scale diff 50, i.e. 2 levels of the fixed 0/25/50/75/100 domain).
    await asRequest(bId, (client) =>
      client.query(
        `insert into answers (wavelength_id, question_id, participant, value) values
           ($1, $2, 'B', '0'::jsonb),
           ($1, $3, 'B', '50'::jsonb),
           ($1, $4, 'B', '2'::jsonb),
           ($1, $5, 'B', '0'::jsonb),
           ($1, $6, 'B', '75'::jsonb)`,
        [wavelengthId, q0!.id, q1!.id, q2!.id, q3!.id, q4!.id],
      ),
    );
    await submitFinalB(bId, wavelengthId);

    // Fetch exactly as the result page does: as an authorized participant,
    // via RLS, after COMPLETED.
    const [questionRows, answerRows] = await asRequest(aId, async (client) => {
      const { rows: qRows } = await client.query(
        "select id, category, type, text, options, order_index from questions where wavelength_id = $1 order by order_index",
        [wavelengthId],
      );
      const { rows: aRows } = await client.query(
        "select question_id, participant, value from answers where wavelength_id = $1",
        [wavelengthId],
      );
      return [qRows, aRows as ResultAnswerRow[]];
    });

    const view = buildWavelengthResultView(questionRows, answerRows);

    // Global: (100 + 100 + 0 + 0 + 50) / 5 = 50 -> exactly the
    // Mixed/Low boundary.
    expect(view.global.score).toBe(50);
    expect(view.global.level).toBe("Mixed Alignment");

    // relationship (q0, order 0) and lifestyle (q1, order 1) tie at 100 —
    // tie broken by original question order.
    expect(view.categories.map((c) => c.category)).toEqual([
      "relationship",
      "lifestyle",
      "values_priorities",
      "money",
      "future",
    ]);

    expect(view.whereAligned.map((q) => q.id)).toEqual([q0!.id, q1!.id, q4!.id]);

    expect(view.differentWavelengths).toHaveLength(3);
    expect(view.differentWavelengths[0]!.score).toBeLessThanOrEqual(
      view.differentWavelengths[1]!.score,
    );

    // Scale answers render their label, not the raw stored integer.
    const q4Display = view.allQuestions.find((q) => q.id === q4!.id)!;
    expect(q4Display.answerA).toBe("Poco importante");
    expect(q4Display.answerB).toBe("Muy importante");

    // Choice answers render the option text, not the raw index.
    const q0Display = view.allQuestions.find((q) => q.id === q0!.id)!;
    expect(q0Display.answerA).toBe("Stay in");
    expect(q0Display.answerB).toBe("Stay in");
  });
});
