import { beforeEach, describe, expect, it } from "vitest";

import { asRequest, resetDatabase } from "./setup/db";
import { createDraft } from "./setup/fixtures";

// QA fix: editing a question's text/options after A has already answered it
// must invalidate that answer whenever it's no longer actually valid for
// the edited question (questions_invalidate_answers_on_edit trigger,
// 20260907120000_invalidate_answer_on_question_edit.sql, refined by the
// bug-fix pass in 20260910120000_refine_answer_invalidation.sql). These
// tests drive the trigger directly via the same raw UPDATE statements the
// app's Server Actions issue (app/actions/questions.ts's updateQuestion),
// since the invariant is enforced at the DB layer regardless of which code
// path updates `text`/`category`/`options`.
//
// Bug-fix pass rule (confirmed product requirement, supersedes the
// original "any options change invalidates" behavior): a Choice answer is
// preserved — re-indexed if its option shifted position — as long as the
// exact option TEXT it pointed to still exists somewhere in the new
// options; it's only cleared once that exact text is genuinely gone.
// Question text changes and type changes still always clear, unconditionally.

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

// ── Test 4 (bug-fix pass) ──────────────────────────────────────────────
describe("Test 4: editing a NON-selected option's text PRESERVES A's answer, since the selected value is still exactly valid", () => {
  it("keeps the existing answer (same index — the selected option's own position never moved)", async () => {
    const { aId, wavelengthId } = await createDraft();
    const qId = await insertChoiceQuestion(aId, wavelengthId, ["Option 1", "Option 2"]);
    await answerChoice(aId, wavelengthId, qId, 0); // picked "Option 1"

    // Only Option 2 (not the one A picked) changes — "Option 1" is still
    // exactly present, so the answer must survive.
    await asRequest(aId, (client) =>
      client.query(
        `update questions set options = '["Option 1","Option 2 (edited)"]'::jsonb where id = $1`,
        [qId],
      ),
    );

    expect(await getAnswer(aId, wavelengthId, qId)).toBe(0);
  });
});

// ── Test 5 (bug-fix pass) ──────────────────────────────────────────────
describe("Test 5: adding an option PRESERVES A's answer, since the selected value is still exactly valid", () => {
  it("keeps the existing answer", async () => {
    const { aId, wavelengthId } = await createDraft();
    const qId = await insertChoiceQuestion(aId, wavelengthId, ["Option 1", "Option 2"]);
    await answerChoice(aId, wavelengthId, qId, 0); // picked "Option 1"

    await asRequest(aId, (client) =>
      client.query(
        `update questions set options = '["Option 1","Option 2","Option 3"]'::jsonb where id = $1`,
        [qId],
      ),
    );

    expect(await getAnswer(aId, wavelengthId, qId)).toBe(0);
  });
});

// ── Test 6 (bug-fix pass) ───────────────────────────────────────────────
describe("Test 6: removing a DIFFERENT (non-selected) option PRESERVES A's answer, re-indexed to the same text's new position", () => {
  it("keeps the existing answer at its original index when the removed option was after it", async () => {
    const { aId, wavelengthId } = await createDraft();
    const qId = await insertChoiceQuestion(aId, wavelengthId, ["Option 1", "Option 2", "Option 3"]);
    await answerChoice(aId, wavelengthId, qId, 0); // picked "Option 1"

    // Removes "Option 3" (after the selected one) — "Option 1" stays at
    // index 0, so the answer needs no re-indexing at all.
    await asRequest(aId, (client) =>
      client.query(
        `update questions set options = '["Option 1","Option 2"]'::jsonb where id = $1`,
        [qId],
      ),
    );

    expect(await getAnswer(aId, wavelengthId, qId)).toBe(0);
  });

  it("re-indexes the answer when the removed option was BEFORE the selected one", async () => {
    const { aId, wavelengthId } = await createDraft();
    const qId = await insertChoiceQuestion(aId, wavelengthId, ["Option 1", "Option 2", "Option 3"]);
    await answerChoice(aId, wavelengthId, qId, 2); // picked "Option 3"

    // Removes "Option 2" (before the selected one) — "Option 3" is still
    // exactly present, but its index shifts from 2 to 1. The stored answer
    // must be updated to point at the new position, not silently point at
    // the wrong option ("Option 1", now at index... no, still 0) or the
    // now-out-of-range old index.
    await asRequest(aId, (client) =>
      client.query(
        `update questions set options = '["Option 1","Option 3"]'::jsonb where id = $1`,
        [qId],
      ),
    );

    expect(await getAnswer(aId, wavelengthId, qId)).toBe(1);
  });
});

// ── Test G (QA round 2) ────────────────────────────────────────────────
// Distinct from Test 6 above (which removes a *different* option and keeps
// the selected one) — this removes the exact option A had selected. This
// was already the one case that visibly "worked" in the browser before the
// round-2 UI fix (because the selected radio's own DOM node disappears when
// its option is removed) — confirming the DB layer invalidates it too,
// for the right reason, not just by coincidence of the node vanishing.
describe("Test G: removing the SELECTED option itself invalidates A's answer", () => {
  it("removes the existing answer", async () => {
    const { aId, wavelengthId } = await createDraft();
    const qId = await insertChoiceQuestion(aId, wavelengthId, ["Option 1", "Option 2", "Option 3"]);
    await answerChoice(aId, wavelengthId, qId, 0); // picked "Option 1"

    await asRequest(aId, (client) =>
      client.query(
        `update questions set options = '["Option 2","Option 3"]'::jsonb where id = $1`,
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

// ── Tests 5/6: type changes always invalidate, in both directions ──────
describe("Test 5: Choice -> Scale always invalidates the existing answer", () => {
  it("clears options and the existing answer", async () => {
    const { aId, wavelengthId } = await createDraft();
    const qId = await insertChoiceQuestion(aId, wavelengthId, ["Option 1", "Option 2"]);
    await answerChoice(aId, wavelengthId, qId, 0);

    await asRequest(aId, (client) =>
      client.query("update questions set type = 'scale', options = null where id = $1", [qId]),
    );

    expect(await getAnswer(aId, wavelengthId, qId)).toBeUndefined();
  });
});

describe("Test 6: Scale -> Choice always invalidates the existing answer", () => {
  it("clears the existing scale answer even though the new options are 'fresh'", async () => {
    const { aId, wavelengthId } = await createDraft();
    const qId = await insertScaleQuestion(aId, wavelengthId);
    await answerChoice(aId, wavelengthId, qId, 50); // a scale value, not an option index

    await asRequest(aId, (client) =>
      client.query(
        `update questions set type = 'choice', options = '["Option 1","Option 2"]'::jsonb where id = $1`,
        [qId],
      ),
    );

    expect(await getAnswer(aId, wavelengthId, qId)).toBeUndefined();
  });
});

// ── Tests 7/8: invalidation is a real, DB-enforced unanswered state ────
describe("Test 7/8: an invalidated question counts as unanswered, and blocks finalizing until answered again", () => {
  it("finalize_draft rejects while the edited question is still unanswered, then succeeds once re-answered", async () => {
    const { aId, wavelengthId } = await createDraft();
    // 5 questions — the minimum to finalize — all answered. Inserted with
    // an explicit distinct order_index each (insertChoiceQuestion always
    // uses 0, which would collide with questions_order_unique here).
    const qIds: string[] = [];
    for (let i = 0; i < 5; i++) {
      const qId = await asRequest(aId, async (client) => {
        const { rows } = await client.query<{ id: string }>(
          `insert into questions (wavelength_id, category, type, text, options, order_index)
           values ($1, 'relationship', 'choice', $2, '["Option 1","Option 2"]'::jsonb, $3)
           returning id`,
          [wavelengthId, `Question ${i}`, i],
        );
        return rows[0]!.id;
      });
      await answerChoice(aId, wavelengthId, qId, 0);
      qIds.push(qId);
    }

    // Edit one question's text — its answer is invalidated (deleted).
    await asRequest(aId, (client) =>
      client.query("update questions set text = 'Question 0 (edited)' where id = $1", [qIds[0]]),
    );
    expect(await getAnswer(aId, wavelengthId, qIds[0]!)).toBeUndefined();

    // finalize_draft's own count-based check (enforce_wavelength_transition)
    // must reject: 4 answered out of 5 questions.
    await expect(
      asRequest(aId, (client) =>
        client.query("select finalize_draft($1, $2)", [wavelengthId, "Alex"]),
      ),
    ).rejects.toThrow(/has not answered all questions/);

    // Re-answering the invalidated question makes it count again, and
    // finalize now succeeds.
    await answerChoice(aId, wavelengthId, qIds[0]!, 1);
    await expect(
      asRequest(aId, (client) =>
        client.query("select finalize_draft($1, $2)", [wavelengthId, "Alex"]),
      ),
    ).resolves.not.toThrow();
  });
});
