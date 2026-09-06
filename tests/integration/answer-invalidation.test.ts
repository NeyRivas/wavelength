import { beforeEach, describe, expect, it } from "vitest";

import { asRequest, resetDatabase } from "./setup/db";
import { createDraft } from "./setup/fixtures";

// QA fix: editing a question's text/options after A has already answered it
// must invalidate that answer (questions_invalidate_answers_on_edit trigger,
// 20260907120000_invalidate_answer_on_question_edit.sql). These tests drive
// the trigger directly via the same raw UPDATE statements the app's Server
// Actions issue (app/actions/questions.ts's updateQuestion), since the
// invariant is enforced at the DB layer regardless of which code path
// updates `text`/`options`.

beforeEach(async () => {
  await resetDatabase();
});

async function insertChoiceQuestion(
  aId: string,
  wavelengthId: string,
  options: string[],
  text = "Ideal weekend?",
): Promise<string> {
  return asRequest(aId, async (client) => {
    const { rows } = await client.query<{ id: string }>(
      `insert into questions (wavelength_id, category, type, text, options, order_index)
       values ($1, 'relationship', 'choice', $2, $3::jsonb, 0)
       returning id`,
      [wavelengthId, text, JSON.stringify(options)],
    );
    return rows[0]!.id;
  });
}

async function insertScaleQuestion(
  aId: string,
  wavelengthId: string,
  text = "Importance of routine",
): Promise<string> {
  return asRequest(aId, async (client) => {
    const { rows } = await client.query<{ id: string }>(
      `insert into questions (wavelength_id, category, type, text, options, order_index)
       values ($1, 'lifestyle', 'scale', $2, null, 0)
       returning id`,
      [wavelengthId, text],
    );
    return rows[0]!.id;
  });
}

async function answerChoice(aId: string, wavelengthId: string, questionId: string, value: number) {
  await asRequest(aId, (client) =>
    client.query(
      `insert into answers (wavelength_id, question_id, participant, value)
       values ($1, $2, 'A', $3::jsonb)`,
      [wavelengthId, questionId, JSON.stringify(value)],
    ),
  );
}

async function getAnswer(aId: string, wavelengthId: string, questionId: string) {
  const rows = await asRequest(aId, async (client) => {
    const { rows } = await client.query(
      "select value from answers where wavelength_id = $1 and question_id = $2 and participant = 'A'",
      [wavelengthId, questionId],
    );
    return rows;
  });
  return rows[0]?.value;
}

// ── Test 1 ──────────────────────────────────────────────────────────────
describe("Test 1: editing a Choice question's text invalidates A's answer", () => {
  it("removes the existing answer once the text actually changes", async () => {
    const { aId, wavelengthId } = await createDraft();
    const qId = await insertChoiceQuestion(aId, wavelengthId, ["Stay in", "Go out"]);
    await answerChoice(aId, wavelengthId, qId, 0);
    expect(await getAnswer(aId, wavelengthId, qId)).toBe(0);

    await asRequest(aId, (client) =>
      client.query("update questions set text = 'Ideal weekend plans?' where id = $1", [qId]),
    );

    expect(await getAnswer(aId, wavelengthId, qId)).toBeUndefined();
  });
});

// ── Test 2 ──────────────────────────────────────────────────────────────
describe("Test 2: editing a Scale question's text invalidates A's answer", () => {
  it("removes the existing answer once the text actually changes", async () => {
    const { aId, wavelengthId } = await createDraft();
    const qId = await insertScaleQuestion(aId, wavelengthId);
    await answerChoice(aId, wavelengthId, qId, 50); // scale value, not an option index

    await asRequest(aId, (client) =>
      client.query("update questions set text = 'Importance of daily routine' where id = $1", [
        qId,
      ]),
    );

    expect(await getAnswer(aId, wavelengthId, qId)).toBeUndefined();
  });
});

// ── Test 3 ──────────────────────────────────────────────────────────────
describe("Test 3: editing the SELECTED option's text invalidates A's answer", () => {
  it("removes the existing answer", async () => {
    const { aId, wavelengthId } = await createDraft();
    const qId = await insertChoiceQuestion(aId, wavelengthId, ["Option 1", "Option 2"]);
    await answerChoice(aId, wavelengthId, qId, 0); // picked "Option 1"

    await asRequest(aId, (client) =>
      client.query(
        `update questions set options = '["Option 1 (edited)","Option 2"]'::jsonb where id = $1`,
        [qId],
      ),
    );

    expect(await getAnswer(aId, wavelengthId, qId)).toBeUndefined();
  });
});

// ── Test 4 ──────────────────────────────────────────────────────────────
describe("Test 4: editing a NON-selected option's text also invalidates A's answer", () => {
  it("removes the existing answer even though the chosen option's own text is untouched", async () => {
    const { aId, wavelengthId } = await createDraft();
    const qId = await insertChoiceQuestion(aId, wavelengthId, ["Option 1", "Option 2"]);
    await answerChoice(aId, wavelengthId, qId, 0); // picked "Option 1"

    // Only Option 2 (not the one A picked) changes.
    await asRequest(aId, (client) =>
      client.query(
        `update questions set options = '["Option 1","Option 2 (edited)"]'::jsonb where id = $1`,
        [qId],
      ),
    );

    expect(await getAnswer(aId, wavelengthId, qId)).toBeUndefined();
  });
});

// ── Test 5 ──────────────────────────────────────────────────────────────
describe("Test 5: adding an option invalidates A's answer", () => {
  it("removes the existing answer", async () => {
    const { aId, wavelengthId } = await createDraft();
    const qId = await insertChoiceQuestion(aId, wavelengthId, ["Option 1", "Option 2"]);
    await answerChoice(aId, wavelengthId, qId, 0);

    await asRequest(aId, (client) =>
      client.query(
        `update questions set options = '["Option 1","Option 2","Option 3"]'::jsonb where id = $1`,
        [qId],
      ),
    );

    expect(await getAnswer(aId, wavelengthId, qId)).toBeUndefined();
  });
});

// ── Test 6 ──────────────────────────────────────────────────────────────
describe("Test 6: removing an option invalidates A's answer", () => {
  it("removes the existing answer", async () => {
    const { aId, wavelengthId } = await createDraft();
    const qId = await insertChoiceQuestion(aId, wavelengthId, ["Option 1", "Option 2", "Option 3"]);
    await answerChoice(aId, wavelengthId, qId, 2); // picked "Option 3"

    await asRequest(aId, (client) =>
      client.query(
        `update questions set options = '["Option 1","Option 3"]'::jsonb where id = $1`,
        [qId],
      ),
    );

    expect(await getAnswer(aId, wavelengthId, qId)).toBeUndefined();
  });
});

// ── Test 7 ──────────────────────────────────────────────────────────────
describe("Test 7: simply changing the answer does NOT invalidate anything", () => {
  it("a plain answer upsert (no question/option edit involved) just replaces the value", async () => {
    const { aId, wavelengthId } = await createDraft();
    const qId = await insertChoiceQuestion(aId, wavelengthId, ["Option 1", "Option 2"]);
    await answerChoice(aId, wavelengthId, qId, 0);
    expect(await getAnswer(aId, wavelengthId, qId)).toBe(0);

    // Same pattern AnswerControl's auto-save uses: an upsert, not a
    // question/option edit — the trigger has nothing to do with this path.
    await asRequest(aId, (client) =>
      client.query(
        `insert into answers (wavelength_id, question_id, participant, value)
         values ($1, $2, 'A', '1'::jsonb)
         on conflict (question_id, participant) do update set value = excluded.value`,
        [wavelengthId, qId],
      ),
    );

    expect(await getAnswer(aId, wavelengthId, qId)).toBe(1);
  });

  it("also holds for Scale — changing the level doesn't touch the question at all", async () => {
    const { aId, wavelengthId } = await createDraft();
    const qId = await insertScaleQuestion(aId, wavelengthId);
    await answerChoice(aId, wavelengthId, qId, 50);

    await asRequest(aId, (client) =>
      client.query(
        `insert into answers (wavelength_id, question_id, participant, value)
         values ($1, $2, 'A', '75'::jsonb)
         on conflict (question_id, participant) do update set value = excluded.value`,
        [wavelengthId, qId],
      ),
    );

    expect(await getAnswer(aId, wavelengthId, qId)).toBe(75);
  });
});

// ── extra: same-value re-save is a no-op (no spurious invalidation) ────
describe("re-saving a question with the exact same text/options is a no-op", () => {
  it("does not invalidate the existing answer", async () => {
    const { aId, wavelengthId } = await createDraft();
    const qId = await insertChoiceQuestion(aId, wavelengthId, ["Option 1", "Option 2"]);
    await answerChoice(aId, wavelengthId, qId, 0);

    // Same text, same options — this is what a blur with no actual edit
    // looks like at the DB layer.
    await asRequest(aId, (client) =>
      client.query(
        `update questions set text = 'Ideal weekend?', options = '["Option 1","Option 2"]'::jsonb where id = $1`,
        [qId],
      ),
    );

    expect(await getAnswer(aId, wavelengthId, qId)).toBe(0);
  });
});

// ── extra: a type change that replaces options also invalidates ────────
describe("changing a question's type (which replaces its options) also invalidates", () => {
  it("switching Choice -> Scale clears options and invalidates the existing answer", async () => {
    const { aId, wavelengthId } = await createDraft();
    const qId = await insertChoiceQuestion(aId, wavelengthId, ["Option 1", "Option 2"]);
    await answerChoice(aId, wavelengthId, qId, 0);

    await asRequest(aId, (client) =>
      client.query("update questions set type = 'scale', options = null where id = $1", [qId]),
    );

    expect(await getAnswer(aId, wavelengthId, qId)).toBeUndefined();
  });
});
