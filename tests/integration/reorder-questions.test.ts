import { beforeEach, describe, expect, it } from "vitest";

import { asRequest, createTestUser, resetDatabase } from "./setup/db";
import { addQuestions, answerAll, claimAsB, createDraft, finalizeAsA } from "./setup/fixtures";

beforeEach(async () => {
  await resetDatabase();
});

async function orderedQuestionIds(userId: string, wavelengthId: string): Promise<string[]> {
  return asRequest(userId, async (client) => {
    const { rows } = await client.query<{ id: string }>(
      "select id from questions where wavelength_id = $1 order by order_index",
      [wavelengthId],
    );
    return rows.map((r) => r.id);
  });
}

describe("reorder_questions", () => {
  it("reorders questions atomically, including a straight reversal (every position collides mid-permutation)", async () => {
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId, 5);
    const originalIds = questions.map((q) => q.id);
    const reversedIds = [...originalIds].reverse();

    await asRequest(aId, (client) =>
      client.query("select reorder_questions($1, $2::uuid[])", [wavelengthId, reversedIds]),
    );

    expect(await orderedQuestionIds(aId, wavelengthId)).toEqual(reversedIds);
  });

  it("supports an arbitrary shuffle, not just a reversal", async () => {
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId, 5);
    const ids = questions.map((q) => q.id);
    const shuffled = [ids[2]!, ids[0]!, ids[4]!, ids[1]!, ids[3]!];

    await asRequest(aId, (client) =>
      client.query("select reorder_questions($1, $2::uuid[])", [wavelengthId, shuffled]),
    );

    expect(await orderedQuestionIds(aId, wavelengthId)).toEqual(shuffled);
  });

  it("rejects a permutation missing a question", async () => {
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId, 5);
    const incomplete = questions.slice(0, 4).map((q) => q.id);

    await expect(
      asRequest(aId, (client) =>
        client.query("select reorder_questions($1, $2::uuid[])", [wavelengthId, incomplete]),
      ),
    ).rejects.toThrow(/exactly the current set of questions/);
  });

  it("rejects a permutation with a duplicate id", async () => {
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId, 5);
    const ids = questions.map((q) => q.id);
    const withDuplicate = [ids[0]!, ids[0]!, ids[1]!, ids[2]!, ids[3]!];

    await expect(
      asRequest(aId, (client) =>
        client.query("select reorder_questions($1, $2::uuid[])", [wavelengthId, withDuplicate]),
      ),
    ).rejects.toThrow(/exactly the current set of questions/);
  });

  it("rejects a permutation containing an id from a different wavelength", async () => {
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId, 5);
    const ids = questions.map((q) => q.id);

    const other = await createDraft();
    const otherQuestions = await addQuestions(other.aId, other.wavelengthId, 5);

    const contaminated = [otherQuestions[0]!.id, ...ids.slice(1)];

    await expect(
      asRequest(aId, (client) =>
        client.query("select reorder_questions($1, $2::uuid[])", [wavelengthId, contaminated]),
      ),
    ).rejects.toThrow(/exactly the current set of questions/);
  });

  it("rejects reordering someone else's questionnaire (RLS still applies)", async () => {
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId, 5);
    const reversedIds = questions.map((q) => q.id).reverse();

    // A stranger has no RLS SELECT access to these questions at all, so the
    // membership check itself sees an empty set for them — a different
    // (still correctly rejecting, and arguably more private — it doesn't
    // confirm the wavelength's contents to a non-participant) error branch
    // than the "you own it but it's locked" case exercised below.
    const stranger = await createTestUser();
    await expect(
      asRequest(stranger, (client) =>
        client.query("select reorder_questions($1, $2::uuid[])", [wavelengthId, reversedIds]),
      ),
    ).rejects.toThrow(/exactly the current set of questions/);

    // Nothing changed — the failed attempt didn't silently partially apply.
    expect(await orderedQuestionIds(aId, wavelengthId)).toEqual(questions.map((q) => q.id));
  });

  it("rejects reordering once the questionnaire has left DRAFT, even for A", async () => {
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId, 5);
    await answerAll(aId, wavelengthId, questions, "A");
    await finalizeAsA(aId, wavelengthId); // -> WAITING, questions now locked

    const reversedIds = questions.map((q) => q.id).reverse();

    // questions_update's USING clause is ownership-only (no state check),
    // so the UPDATE still targets these rows and its WITH CHECK (state =
    // DRAFT) rejects them immediately — a standard RLS violation, not the
    // function's own diagnostics-based message (see the next test for that
    // branch).
    await expect(
      asRequest(aId, (client) =>
        client.query("select reorder_questions($1, $2::uuid[])", [wavelengthId, reversedIds]),
      ),
    ).rejects.toThrow(/row-level security/);

    expect(await orderedQuestionIds(aId, wavelengthId)).toEqual(questions.map((q) => q.id));
  });

  it("rejects B reordering A's questionnaire (B can read the questions, but questions_update is A-only)", async () => {
    const { aId, wavelengthId, shareToken } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId, 5);
    await answerAll(aId, wavelengthId, questions, "A");
    await finalizeAsA(aId, wavelengthId);

    const bId = await createTestUser();
    await claimAsB(bId, shareToken);

    const reversedIds = questions.map((q) => q.id).reverse();

    // B is a real participant and CAN read the question set (questions_select
    // allows either participant), so the membership check passes — this is
    // what exercises the diagnostics-based row-count check: the UPDATE's
    // USING clause silently excludes every row (ownership is A-only), so
    // 0 rows are touched with no RLS exception of their own.
    await expect(
      asRequest(bId, (client) =>
        client.query("select reorder_questions($1, $2::uuid[])", [wavelengthId, reversedIds]),
      ),
    ).rejects.toThrow(/no longer be in DRAFT, or the caller does not own it/);

    expect(await orderedQuestionIds(aId, wavelengthId)).toEqual(questions.map((q) => q.id));
  });

  it("still enforces uniqueness for a genuinely invalid reorder (not just a permutation)", async () => {
    // Sanity check that making the constraint deferrable didn't weaken it:
    // a direct attempt to give two questions the same order_index (not a
    // valid permutation at all) must still fail by commit time.
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId, 2);

    await expect(
      asRequest(aId, (client) =>
        client.query("update questions set order_index = 0 where wavelength_id = $1", [
          wavelengthId,
        ]),
      ),
    ).rejects.toThrow(/questions_order_unique/);
  });
});
