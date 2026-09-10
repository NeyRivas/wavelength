import { beforeEach, describe, expect, it } from "vitest";

import { asRequest, resetDatabase } from "./setup/db";
import { addQuestions, answerAll, createDraft, finalizeAsA } from "./setup/fixtures";

beforeEach(async () => {
  await resetDatabase();
});

// Bug-fix pass: category editing before sharing is an intentional product
// requirement — this used to be unconditionally DB-immutable (even during
// DRAFT), which was wrong. It's now freely editable up to the moment A
// shares, and locked from then on (enforce_question_category_immutable,
// 20260910120100_category_editable_before_share.sql), same as every other
// question field. `questions_update`'s RLS policy is itself already
// DRAFT-only, so the WAITING/IN_PROGRESS/COMPLETED case below is blocked by
// RLS before this trigger even runs — the trigger is deliberately still
// checked (defense-in-depth, this project's standing pattern), so its own
// exception message is what a caller sees if RLS were ever misconfigured.
describe("question editing: category can be changed before sharing, locked after", () => {
  it("allows changing a question's category while DRAFT", async () => {
    const { aId, wavelengthId } = await createDraft();
    const [q] = await addQuestions(aId, wavelengthId, 1); // category: relationship

    await asRequest(aId, (client) =>
      client.query("update questions set category = 'money' where id = $1", [q!.id]),
    );

    const rows = await asRequest(aId, async (client) => {
      const { rows } = await client.query("select category from questions where id = $1", [q!.id]);
      return rows;
    });
    expect(rows[0]?.category).toBe("money");
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

  // Regression test for the reported bug: changing category in the real
  // /create UI surfaced "Something went wrong" (root cause: enforce_
  // question_category_immutable's cross-table wavelengths lookup wasn't
  // security definer, so it was needlessly subject to RLS — fixed in
  // 20260910130000_category_immutable_check_is_security_definer.sql).
  // This drives the exact UPDATE shape app/actions/questions.ts's
  // updateQuestion issues — text, category, and options together in one
  // statement, category the only thing actually changing — rather than a
  // category-only UPDATE, to match the real code path precisely.
  it("persists a changed category via the same full-row UPDATE shape updateQuestion issues, without clearing a valid answer", async () => {
    const { aId, wavelengthId } = await createDraft();
    const [q] = await addQuestions(aId, wavelengthId, 1); // choice, category: relationship
    await answerAll(aId, wavelengthId, [q!], "A");

    await expect(
      asRequest(aId, (client) =>
        client.query(
          `update questions
             set text = $2, category = $3, options = $4::jsonb
           where id = $1`,
          [q!.id, "Ideal weekend #0", "money", JSON.stringify(["Stay in", "Go out"])],
        ),
      ),
    ).resolves.not.toThrow();

    const rows = await asRequest(aId, async (client) => {
      const { rows } = await client.query("select category from questions where id = $1", [q!.id]);
      return rows;
    });
    expect(rows[0]?.category).toBe("money");

    // A valid answer survives — text/options are unchanged in this update,
    // so questions_invalidate_answers_on_edit has nothing to clear.
    const answers = await asRequest(aId, async (client) => {
      const { rows } = await client.query(
        "select value from answers where question_id = $1 and participant = 'A'",
        [q!.id],
      );
      return rows;
    });
    expect(answers).toHaveLength(1);

    // Persists across a fresh, later read (a page reload).
    const reread = await asRequest(aId, async (client) => {
      const { rows } = await client.query("select category from questions where id = $1", [q!.id]);
      return rows;
    });
    expect(reread[0]?.category).toBe("money");
  });

  it("changing only the category does not touch an existing answer", async () => {
    const { aId, wavelengthId } = await createDraft();
    const [q] = await addQuestions(aId, wavelengthId, 1);
    await answerAll(aId, wavelengthId, [q!], "A");

    await asRequest(aId, (client) =>
      client.query("update questions set category = 'money' where id = $1", [q!.id]),
    );

    const rows = await asRequest(aId, async (client) => {
      const { rows } = await client.query(
        "select value from answers where question_id = $1 and participant = 'A'",
        [q!.id],
      );
      return rows;
    });
    expect(rows).toHaveLength(1);
  });

  it("rejects changing category once the wavelength is no longer DRAFT (shared)", async () => {
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId, 5);
    await answerAll(aId, wavelengthId, questions, "A");
    await finalizeAsA(aId, wavelengthId);

    // RLS's own questions_update policy is DRAFT-only, so this is already
    // blocked there — asserting on the effect either way (the trigger's
    // own message if it's ever reached, an empty update otherwise).
    await expect(
      asRequest(aId, (client) =>
        client.query("update questions set category = 'money' where id = $1", [questions[0]!.id]),
      ),
    ).rejects.toThrow();

    const rows = await asRequest(aId, async (client) => {
      const { rows } = await client.query("select category from questions where id = $1", [
        questions[0]!.id,
      ]);
      return rows;
    });
    expect(rows[0]?.category).not.toBe("money");
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

// Tests I/J (QA round 2): adding a new option and filling in its text
// persists on the same update the browser's blur-triggered submit sends,
// and a later, independent read (a fresh connection — the same thing a
// page reload does) sees exactly that persisted value. Root cause of the
// original "doesn't seem to save" report was missing UI feedback, not a
// persistence bug — this is the DB-layer half of that proof (the client
// fix — actual "Saved" feedback — lives in question-edit-form.tsx).
describe("question editing: adding a new option persists immediately and survives a fresh read (QA fix)", () => {
  it("appending a new, filled-in option to an existing question persists and is visible on a later read", async () => {
    const { aId, wavelengthId } = await createDraft();
    const qId = await asRequest(aId, async (client) => {
      const { rows } = await client.query<{ id: string }>(
        `insert into questions (wavelength_id, category, type, text, options, order_index)
         values ($1, 'relationship', 'choice', 'Ideal weekend?', '["Stay in","Go out"]'::jsonb, 0)
         returning id`,
        [wavelengthId],
      );
      return rows[0]!.id;
    });

    // Exactly what the form submits once the new option's own blur fires:
    // the full array, new option included.
    await asRequest(aId, (client) =>
      client.query(
        `update questions set options = '["Stay in","Go out","Stay in and go out"]'::jsonb where id = $1`,
        [qId],
      ),
    );

    // A separate, later request (its own fresh connection) — the same
    // thing a page reload does — must see the persisted value.
    const rows = await asRequest(aId, async (client) => {
      const { rows } = await client.query("select options from questions where id = $1", [qId]);
      return rows;
    });
    expect(rows[0]?.options).toEqual(["Stay in", "Go out", "Stay in and go out"]);
  });
});
