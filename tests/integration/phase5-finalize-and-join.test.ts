import { beforeEach, describe, expect, it } from "vitest";

import { asRequest, createTestUser, resetDatabase } from "./setup/db";
import {
  addQuestions,
  answerAll,
  claimAsB,
  createDraft,
  finalizeAsA,
  validAnswerValue,
} from "./setup/fixtures";

// Phase 5 builds the app layer (Server Actions + UI) on top of RPCs and RLS
// policies that already existed and were already proven by Phase 1's suite
// (finalize_draft, claim_participant_b, the privacy/locking RLS policies).
// This file does not re-litigate all of that in isolation; it specifically
// covers what's new to this phase: the full finalize -> preview -> join ->
// answer -> resume flow end-to-end, a genuinely concurrent (not just
// sequential) claim race, and B's resume behavior across separate requests.

beforeEach(async () => {
  await resetDatabase();
});

async function draftReadyToFinalize(overrides: { questionCount?: number } = {}) {
  const { aId, wavelengthId, shareToken } = await createDraft();
  const questions = await addQuestions(aId, wavelengthId, overrides.questionCount);
  await answerAll(aId, wavelengthId, questions, "A");
  return { aId, wavelengthId, shareToken, questions };
}

describe("A finalization -> share (full flow)", () => {
  it("finalizes, and the resulting share link's preview reflects it correctly", async () => {
    const { aId, wavelengthId, shareToken } = await draftReadyToFinalize();

    await finalizeAsA(aId, wavelengthId, "Alex");

    const row = await asRequest(aId, async (client) => {
      const { rows } = await client.query(
        "select state, participant_a_alias, share_token, waiting_at from wavelengths where id = $1",
        [wavelengthId],
      );
      return rows[0];
    });
    expect(row.state).toBe("WAITING");
    expect(row.participant_a_alias).toBe("Alex");
    expect(row.share_token).toBe(shareToken);
    expect(row.waiting_at).not.toBeNull();

    // The same information a stranger sees via the share link, before
    // claiming — this is what app/w/[token]/page.tsx's join screen renders.
    const stranger = await createTestUser();
    const preview = await asRequest(stranger, async (client) => {
      const { rows } = await client.query("select * from get_wavelength_preview($1)", [shareToken]);
      return rows[0];
    });
    expect(preview.state).toBe("WAITING");
    expect(preview.participant_a_alias).toBe("Alex");
    expect(preview.is_taken).toBe(false);
  });

  it("A can keep re-reading the share link (view/copy) while WAITING and after IN_PROGRESS starts", async () => {
    const { aId, wavelengthId, shareToken } = await draftReadyToFinalize();
    await finalizeAsA(aId, wavelengthId);

    // "View the link again" == the same read a fresh page load would do.
    const readAsA = () =>
      asRequest(aId, async (client) => {
        const { rows } = await client.query(
          "select share_token, state from wavelengths where id = $1",
          [wavelengthId],
        );
        return rows[0];
      });

    expect((await readAsA()).share_token).toBe(shareToken);

    const bId = await createTestUser();
    await claimAsB(bId, shareToken);

    // Still readable, now reflecting IN_PROGRESS — this is app/w/[token]'s
    // "someone has joined" status, never any answer data.
    const afterClaim = await readAsA();
    expect(afterClaim.share_token).toBe(shareToken);
    expect(afterClaim.state).toBe("IN_PROGRESS");
  });
});

describe("locking after finalization: nothing about the questionnaire or A's answers can change", () => {
  it("blocks every questions-table write A previously had, all at once", async () => {
    const { aId, wavelengthId, questions } = await draftReadyToFinalize();
    await finalizeAsA(aId, wavelengthId);
    const [q1, q2] = questions;

    await expect(
      asRequest(aId, (client) =>
        client.query("update questions set text = 'edited after lock' where id = $1", [q1!.id]),
      ),
    ).rejects.toThrow();

    // A DELETE whose row is excluded by RLS's USING clause matches 0 rows
    // and does not throw (unlike an UPDATE's WITH CHECK) — assert on the
    // effect, matching the same pattern used in Phase 4's tests.
    const deleteResult = await asRequest(aId, (client) =>
      client.query("delete from questions where id = $1", [q2!.id]),
    );
    expect(deleteResult.rowCount).toBe(0);

    await expect(
      asRequest(aId, (client) =>
        client.query(
          `insert into questions (wavelength_id, category, type, text, options, order_index)
           values ($1, 'relationship', 'choice', 'Sneaked in after lock', '["a","b"]'::jsonb, 99)`,
          [wavelengthId],
        ),
      ),
    ).rejects.toThrow();
  });

  it("blocks A from changing any of their own answers", async () => {
    const { aId, wavelengthId, questions } = await draftReadyToFinalize();
    await finalizeAsA(aId, wavelengthId);
    const q = questions[0]!;

    await expect(
      asRequest(aId, (client) =>
        client.query(
          `insert into answers (wavelength_id, question_id, participant, value)
           values ($1, $2, 'A', '0'::jsonb)
           on conflict (question_id, participant) do update set value = excluded.value`,
          [wavelengthId, q.id],
        ),
      ),
    ).rejects.toThrow();
  });

  it("cannot be finalized a second time", async () => {
    const { aId, wavelengthId } = await draftReadyToFinalize();
    await finalizeAsA(aId, wavelengthId, "Alex");

    await expect(
      asRequest(aId, (client) =>
        client.query("select finalize_draft($1, $2)", [wavelengthId, "Alex again"]),
      ),
    ).rejects.toThrow(/not in DRAFT state/);
  });
});

describe("B atomic claim: genuinely concurrent race, not just sequential", () => {
  it("exactly one of two simultaneous claim attempts succeeds", async () => {
    const { aId, wavelengthId, shareToken } = await draftReadyToFinalize();
    await finalizeAsA(aId, wavelengthId);

    const firstB = await createTestUser();
    const secondB = await createTestUser();

    const results = await Promise.allSettled([
      claimAsB(firstB, shareToken, "First"),
      claimAsB(secondB, shareToken, "Second"),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const winner = fulfilled[0]!.status === "fulfilled" ? fulfilled[0] : null;
    expect(winner).not.toBeNull();
    const winnerId = (winner as PromiseFulfilledResult<string>).value;
    expect(winnerId).toBe(wavelengthId);

    const row = await asRequest(aId, async (client) => {
      const { rows } = await client.query(
        "select participant_b_id, participant_b_alias, state from wavelengths where id = $1",
        [wavelengthId],
      );
      return rows[0];
    });
    expect(row.state).toBe("IN_PROGRESS");
    expect([firstB, secondB]).toContain(row.participant_b_id);
    // Whoever's id won, their alias is the one stored — no partial/mixed state.
    expect(row.participant_b_alias).toBe(row.participant_b_id === firstB ? "First" : "Second");
  });
});

describe("B answer persistence and resume across separate requests/sessions", () => {
  it("partial progress survives 'leaving and returning' (each save is its own request)", async () => {
    const { aId, wavelengthId, shareToken, questions } = await draftReadyToFinalize({
      questionCount: 5,
    });
    await finalizeAsA(aId, wavelengthId);

    const bId = await createTestUser();
    await claimAsB(bId, shareToken); // "B opens the link and joins"

    const [q1, q2, q3] = questions;

    // Session 1: answer the first question, then "leave" (this asRequest's
    // connection closes after commit — exactly what a real page navigation
    // away, or closing the tab, looks like from the DB's perspective).
    await asRequest(bId, (client) =>
      client.query(
        `insert into answers (wavelength_id, question_id, participant, value) values ($1, $2, 'B', $3::jsonb)`,
        [wavelengthId, q1!.id, JSON.stringify(validAnswerValue(q1!))],
      ),
    );

    // Session 2 ("returns later", same anonymous auth identity): B's
    // previous answer is still there, and B can continue from where they
    // left off.
    const afterReturn = await asRequest(bId, async (client) => {
      const { rows } = await client.query(
        "select question_id, value from answers where wavelength_id = $1 and participant = 'B'",
        [wavelengthId],
      );
      return rows;
    });
    expect(afterReturn).toHaveLength(1);
    expect(afterReturn[0]!.question_id).toBe(q1!.id);

    await asRequest(bId, (client) =>
      client.query(
        `insert into answers (wavelength_id, question_id, participant, value) values ($1, $2, 'B', $3::jsonb)`,
        [wavelengthId, q2!.id, JSON.stringify(validAnswerValue(q2!))],
      ),
    );

    // Session 3: B changes their mind about the first answer before ever
    // submitting — "B can change their own answers before final submission".
    // First, an out-of-range value proves the change path is still fully
    // validated, not a bypass around the normal answer rules.
    await expect(
      asRequest(bId, (client) =>
        client.query(
          `insert into answers (wavelength_id, question_id, participant, value) values ($1, $2, 'B', '9999'::jsonb)
           on conflict (question_id, participant) do update set value = excluded.value`,
          [wavelengthId, q1!.id],
        ),
      ),
    ).rejects.toThrow();

    const validNewValue = q1!.type === "scale" ? 4 : 1; // a different, still-valid value
    await asRequest(bId, (client) =>
      client.query(
        `insert into answers (wavelength_id, question_id, participant, value) values ($1, $2, 'B', $3::jsonb)
         on conflict (question_id, participant) do update set value = excluded.value`,
        [wavelengthId, q1!.id, JSON.stringify(validNewValue)],
      ),
    );

    // Session 4: final check — exactly 2 of 5 answered so far, q1 reflects
    // the changed value, q3 still untouched.
    const finalState = await asRequest(bId, async (client) => {
      const { rows } = await client.query(
        "select question_id, value from answers where wavelength_id = $1 and participant = 'B' order by question_id",
        [wavelengthId],
      );
      return rows;
    });
    expect(finalState).toHaveLength(2);
    const q1Row = finalState.find((r) => r.question_id === q1!.id);
    expect(q1Row?.value).toBe(validNewValue);
    expect(finalState.some((r) => r.question_id === q3!.id)).toBe(false);
  });

  it("B's session survives across requests even with no writes in between (pure resume, no changes)", async () => {
    const { aId, wavelengthId, shareToken, questions } = await draftReadyToFinalize();
    await finalizeAsA(aId, wavelengthId);
    const bId = await createTestUser();
    await claimAsB(bId, shareToken);

    await answerAll(bId, wavelengthId, questions.slice(0, 2), "B");

    // Simulates B just reopening the page later with no new answer yet.
    const rows = await asRequest(bId, async (client) => {
      const { rows } = await client.query(
        "select count(*)::int as n from answers where wavelength_id = $1 and participant = 'B'",
        [wavelengthId],
      );
      return rows;
    });
    expect(rows[0]!.n).toBe(2);
  });
});

describe("privacy before completion, exercised through the actual Phase 5 flow", () => {
  it("neither side's answers are visible to the other while IN_PROGRESS", async () => {
    const { aId, wavelengthId, shareToken, questions } = await draftReadyToFinalize();
    await finalizeAsA(aId, wavelengthId);
    const bId = await createTestUser();
    await claimAsB(bId, shareToken);
    await answerAll(bId, wavelengthId, questions.slice(0, 1), "B"); // partial

    const visibleToA = await asRequest(aId, async (client) => {
      const { rows } = await client.query(
        "select * from answers where wavelength_id = $1 and participant = 'B'",
        [wavelengthId],
      );
      return rows;
    });
    expect(visibleToA).toHaveLength(0);

    const visibleToB = await asRequest(bId, async (client) => {
      const { rows } = await client.query(
        "select * from answers where wavelength_id = $1 and participant = 'A'",
        [wavelengthId],
      );
      return rows;
    });
    expect(visibleToB).toHaveLength(0);
  });

  it("A cannot tell how many questions B has answered (only that B has joined)", async () => {
    const { aId, wavelengthId, shareToken, questions } = await draftReadyToFinalize();
    await finalizeAsA(aId, wavelengthId);
    const bId = await createTestUser();
    await claimAsB(bId, shareToken);
    await answerAll(bId, wavelengthId, questions.slice(0, 3), "B");

    // The only thing app/w/[token]'s ShareView is allowed to query for A is
    // the wavelength row itself (state + B's alias) — it must never query
    // `answers` at all. Confirm that even if it tried, RLS returns nothing.
    const bAnswerCount = await asRequest(aId, async (client) => {
      const { rows } = await client.query(
        "select count(*)::int as n from answers where wavelength_id = $1 and participant = 'B'",
        [wavelengthId],
      );
      return rows[0]!.n;
    });
    expect(bAnswerCount).toBe(0);

    const wavelengthRow = await asRequest(aId, async (client) => {
      const { rows } = await client.query(
        "select state, participant_b_alias from wavelengths where id = $1",
        [wavelengthId],
      );
      return rows[0];
    });
    expect(wavelengthRow.state).toBe("IN_PROGRESS");
    expect(wavelengthRow.participant_b_alias).not.toBeNull();
  });
});

describe("authorization failures specific to the join/answer flow", () => {
  it("a stranger cannot answer as B without claiming first", async () => {
    const { aId, wavelengthId, questions } = await draftReadyToFinalize();
    await finalizeAsA(aId, wavelengthId);
    const stranger = await createTestUser();

    await expect(
      asRequest(stranger, (client) =>
        client.query(
          `insert into answers (wavelength_id, question_id, participant, value) values ($1, $2, 'B', '0'::jsonb)`,
          [wavelengthId, questions[0]!.id],
        ),
      ),
    ).rejects.toThrow();
  });

  it("B cannot claim using someone else's alias field to impersonate A (still just becomes B)", async () => {
    const { aId, wavelengthId, shareToken } = await draftReadyToFinalize();
    await finalizeAsA(aId, wavelengthId, "Alex");
    const bId = await createTestUser();

    await claimAsB(bId, shareToken, "Alex"); // same alias text as A — allowed, aliases aren't unique

    const row = await asRequest(aId, async (client) => {
      const { rows } = await client.query(
        "select participant_a_id, participant_b_id, participant_a_alias, participant_b_alias from wavelengths where id = $1",
        [wavelengthId],
      );
      return rows[0];
    });
    // Two distinct participant slots, never conflated, even with identical alias text.
    expect(row.participant_a_id).not.toBe(row.participant_b_id);
    expect(row.participant_a_id).toBe(aId);
    expect(row.participant_b_id).toBe(bId);
  });

  it("claiming with an invalid (empty) alias is rejected and does not consume the slot", async () => {
    const { aId, wavelengthId, shareToken } = await draftReadyToFinalize();
    await finalizeAsA(aId, wavelengthId);
    const bId = await createTestUser();

    await expect(claimAsB(bId, shareToken, "   ")).rejects.toThrow();

    // The slot is still open — a subsequent, valid claim still works.
    const secondB = await createTestUser();
    const claimed = await claimAsB(secondB, shareToken, "Valid Name");
    expect(claimed).toBe(wavelengthId);
  });
});
