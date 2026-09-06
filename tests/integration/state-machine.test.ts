import { beforeEach, describe, expect, it } from "vitest";

import { asAdmin, asRequest, createTestUser, resetDatabase } from "./setup/db";
import { addQuestions, answerAll, claimAsB, createDraft, finalizeAsA } from "./setup/fixtures";

beforeEach(async () => {
  await resetDatabase();
});

async function getState(wavelengthId: string): Promise<string> {
  return asAdmin(async (client) => {
    const { rows } = await client.query("select state from wavelengths where id = $1", [
      wavelengthId,
    ]);
    return rows[0]!.state;
  });
}

describe("finalize_draft: DRAFT -> WAITING", () => {
  it("rejects finalizing before every question is answered", async () => {
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId);
    await answerAll(aId, wavelengthId, questions.slice(0, questions.length - 1), "A"); // one short

    await expect(finalizeAsA(aId, wavelengthId)).rejects.toThrow(/has not answered all questions/);
    expect(await getState(wavelengthId)).toBe("DRAFT");
  });

  it("rejects an invalid (empty/whitespace) alias", async () => {
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId);
    await answerAll(aId, wavelengthId, questions, "A");

    await expect(finalizeAsA(aId, wavelengthId, "   ")).rejects.toThrow();
  });

  it("accepts a normal Unicode alias — no ASCII-only restriction (security clarification)", async () => {
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId);
    await answerAll(aId, wavelengthId, questions, "A");

    await finalizeAsA(aId, wavelengthId, "Renée 🙂 안녕");
    expect(await getState(wavelengthId)).toBe("WAITING");
  });

  it("rejects someone other than A finalizing", async () => {
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId);
    await answerAll(aId, wavelengthId, questions, "A");

    const stranger = await createTestUser();
    await expect(
      asRequest(stranger, (client) =>
        client.query("select finalize_draft($1, $2)", [wavelengthId, "Impostor"]),
      ),
    ).rejects.toThrow();
    expect(await getState(wavelengthId)).toBe("DRAFT");
  });

  it("succeeds once every question is answered and moves to WAITING", async () => {
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId);
    await answerAll(aId, wavelengthId, questions, "A");

    await finalizeAsA(aId, wavelengthId);
    expect(await getState(wavelengthId)).toBe("WAITING");
  });
});

describe("finalize_draft: question count boundaries (§10 — no upfront target, just 5-12)", () => {
  it("rejects finalizing with only 4 questions, even if all are answered", async () => {
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId, 4);
    await answerAll(aId, wavelengthId, questions, "A");

    await expect(finalizeAsA(aId, wavelengthId)).rejects.toThrow(/between 5 and 12 questions/);
    expect(await getState(wavelengthId)).toBe("DRAFT");
  });

  it("succeeds with exactly 5 questions (the minimum)", async () => {
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId, 5);
    await answerAll(aId, wavelengthId, questions, "A");

    await finalizeAsA(aId, wavelengthId);
    expect(await getState(wavelengthId)).toBe("WAITING");
  });

  it("succeeds with 8 questions (the recommended count, not a requirement)", async () => {
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId, 8);
    await answerAll(aId, wavelengthId, questions, "A");

    await finalizeAsA(aId, wavelengthId);
    expect(await getState(wavelengthId)).toBe("WAITING");
  });

  it("succeeds with exactly 12 questions (the maximum)", async () => {
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId, 12);
    await answerAll(aId, wavelengthId, questions, "A");

    await finalizeAsA(aId, wavelengthId);
    expect(await getState(wavelengthId)).toBe("WAITING");
  });
});

describe("claim_participant_b: WAITING -> IN_PROGRESS", () => {
  async function draftReadyToShare() {
    const { aId, wavelengthId, shareToken } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId);
    await answerAll(aId, wavelengthId, questions, "A");
    await finalizeAsA(aId, wavelengthId);
    return { aId, wavelengthId, shareToken };
  }

  it("the first claimant wins and moves the wavelength to IN_PROGRESS", async () => {
    const { wavelengthId, shareToken } = await draftReadyToShare();
    const bId = await createTestUser();

    const claimedId = await claimAsB(bId, shareToken);
    expect(claimedId).toBe(wavelengthId);
    expect(await getState(wavelengthId)).toBe("IN_PROGRESS");
  });

  it("a second claimant on the same link is rejected outright (atomic claim, no takeover)", async () => {
    const { shareToken } = await draftReadyToShare();
    const firstB = await createTestUser();
    const secondB = await createTestUser();

    await claimAsB(firstB, shareToken);
    await expect(claimAsB(secondB, shareToken, "Interloper")).rejects.toThrow(
      /not available to join/,
    );
  });

  it("A cannot claim their own wavelength as B", async () => {
    const { aId, shareToken } = await draftReadyToShare();
    await expect(claimAsB(aId, shareToken)).rejects.toThrow();
  });

  it("rejects claiming a wavelength that is still DRAFT", async () => {
    const { shareToken } = await createDraft(); // never finalized
    const bId = await createTestUser();
    await expect(claimAsB(bId, shareToken)).rejects.toThrow();
  });

  it("rejects an invalid share token", async () => {
    const bId = await createTestUser();
    await expect(claimAsB(bId, "not-a-real-token")).rejects.toThrow();
  });
});

describe("submit_final_b: IN_PROGRESS -> COMPLETED", () => {
  async function inProgressWavelength() {
    const { aId, wavelengthId, shareToken } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId);
    await answerAll(aId, wavelengthId, questions, "A");
    await finalizeAsA(aId, wavelengthId);
    const bId = await createTestUser();
    await claimAsB(bId, shareToken);
    return { aId, bId, wavelengthId, questions };
  }

  it("rejects submitting before every question is answered by B", async () => {
    const { bId, wavelengthId, questions } = await inProgressWavelength();
    await answerAll(bId, wavelengthId, questions.slice(0, questions.length - 1), "B");

    await expect(
      asRequest(bId, (client) => client.query("select submit_final_b($1)", [wavelengthId])),
    ).rejects.toThrow(/has not answered all questions/);
    expect(await getState(wavelengthId)).toBe("IN_PROGRESS");
  });

  it("rejects A submitting on B's behalf", async () => {
    const { aId, bId, wavelengthId, questions } = await inProgressWavelength();
    await answerAll(bId, wavelengthId, questions, "B");

    await expect(
      asRequest(aId, (client) => client.query("select submit_final_b($1)", [wavelengthId])),
    ).rejects.toThrow();
    expect(await getState(wavelengthId)).toBe("IN_PROGRESS");
  });

  it("succeeds once all of B's answers are in and moves to COMPLETED", async () => {
    const { bId, wavelengthId, questions } = await inProgressWavelength();
    await answerAll(bId, wavelengthId, questions, "B");

    await asRequest(bId, (client) => client.query("select submit_final_b($1)", [wavelengthId]));
    expect(await getState(wavelengthId)).toBe("COMPLETED");
  });
});

describe("no direct client mutation of wavelengths (state changes only via the 3 RPCs)", () => {
  it("A cannot UPDATE their own wavelength row directly — no RLS update policy exists", async () => {
    const { aId, wavelengthId } = await createDraft();
    await expect(
      asRequest(aId, (client) =>
        client.query("update wavelengths set state = 'WAITING' where id = $1", [wavelengthId]),
      ),
    ).rejects.toThrow();
    expect(await getState(wavelengthId)).toBe("DRAFT");
  });

  it("no one can DELETE a wavelength row via the client API", async () => {
    const { aId, wavelengthId } = await createDraft();
    await expect(
      asRequest(aId, (client) =>
        client.query("delete from wavelengths where id = $1", [wavelengthId]),
      ),
    ).rejects.toThrow();
  });
});

describe("state trigger: defense-in-depth independent of RLS", () => {
  // Uses the superuser (admin) connection, which bypasses RLS entirely, to
  // prove the enforce_wavelength_transition trigger is what actually stops
  // an illegal transition — not merely the RLS policy layer above it.
  it("rejects a skipped transition (DRAFT -> COMPLETED) even with RLS bypassed", async () => {
    const { wavelengthId } = await createDraft();
    await expect(
      asAdmin((client) =>
        client.query("update wavelengths set state = 'COMPLETED' where id = $1", [wavelengthId]),
      ),
    ).rejects.toThrow(/invalid wavelength state transition/);
  });

  it("rejects a backward transition (WAITING -> DRAFT) even with RLS bypassed", async () => {
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId);
    await answerAll(aId, wavelengthId, questions, "A");
    await finalizeAsA(aId, wavelengthId);

    await expect(
      asAdmin((client) =>
        client.query("update wavelengths set state = 'DRAFT' where id = $1", [wavelengthId]),
      ),
    ).rejects.toThrow(/invalid wavelength state transition/);
  });

  it("still enforces the business rule (all A answers present) for a raw admin transition", async () => {
    const { aId, wavelengthId } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId);
    await answerAll(aId, wavelengthId, questions.slice(0, 1), "A"); // incomplete

    await expect(
      asAdmin((client) =>
        client.query(
          "update wavelengths set state = 'WAITING', participant_a_alias = 'Alex' where id = $1",
          [wavelengthId],
        ),
      ),
    ).rejects.toThrow(/has not answered all questions/);
  });

  it("allows the IN_PROGRESS -> IN_PROGRESS no-op (B saving partial progress)", async () => {
    const { aId, wavelengthId, shareToken } = await createDraft();
    const questions = await addQuestions(aId, wavelengthId);
    await answerAll(aId, wavelengthId, questions, "A");
    await finalizeAsA(aId, wavelengthId);
    const bId = await createTestUser();
    await claimAsB(bId, shareToken);

    await answerAll(bId, wavelengthId, questions.slice(0, 1), "B"); // partial — no state change needed
    expect(await getState(wavelengthId)).toBe("IN_PROGRESS");
  });
});
