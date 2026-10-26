import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  conversationQuestionTexts,
  THIRTY_SIX_QUESTIONS,
} from "../../lib/wavelength/conversation-experiences";
import {
  getReadyMadeGame,
  GETTING_TO_KNOW_EACH_OTHER_QUESTIONS,
} from "../../lib/wavelength/ready-made-games";

// The journey every catalog card and experience page relies on:
// startReadyMadeGame seeds (or resumes) the visitor's own draft with the
// game's exact questions, then sends them to /create?game=<id>. The
// database is faked here; the real RLS/trigger behavior of the same writes
// is covered by tests/integration/.

vi.mock("@/lib/supabase/identity", () => ({ requireUserId: async () => "user-a" }));

class Redirect extends Error {
  constructor(readonly url: string) {
    super(`redirect ${url}`);
  }
}
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Redirect(url);
  },
}));

type Call = { table: string; op: string; payload?: unknown };

let calls: Call[];
let existingDraft: { id: string } | null;
let existingQuestionCount: number;

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    from(table: string) {
      let op = "select";
      let payload: unknown;
      const builder = {
        select: (_columns?: string, options?: { head?: boolean }) => {
          if (options?.head) op = "count";
          return builder;
        },
        eq: () => builder,
        not: () => builder,
        order: () => builder,
        limit: () => builder,
        insert: (rows: unknown) => {
          op = "insert";
          payload = rows;
          return builder;
        },
        maybeSingle: async () => {
          calls.push({ table, op: "select" });
          return { data: existingDraft };
        },
        single: async () => {
          calls.push({ table, op, payload });
          return { data: { id: "new-draft" }, error: null };
        },
        then: (resolve: (value: unknown) => void) => {
          calls.push({ table, op, payload });
          resolve(op === "count" ? { count: existingQuestionCount } : { error: null });
        },
      };
      return builder;
    },
    rpc: async (name: string, args: unknown) => {
      calls.push({ table: "rpc", op: name, payload: args });
      return { error: null };
    },
  }),
}));

async function start(gameId: string): Promise<string> {
  const { startReadyMadeGame } = await import("../../app/actions/ready-made-games");
  const formData = new FormData();
  formData.set("gameId", gameId);
  try {
    await startReadyMadeGame(formData);
  } catch (error) {
    if (error instanceof Redirect) return error.url;
    throw error;
  }
  throw new Error("startReadyMadeGame returned without redirecting");
}

beforeEach(() => {
  calls = [];
  existingDraft = null;
  existingQuestionCount = 0;
});

describe("startReadyMadeGame: Getting to know each other", () => {
  it("seeds a new draft with the game's exact 12 questions and opens it", async () => {
    expect(await start("getting-to-know-you")).toBe("/create?game=getting-to-know-you");

    const inserts = calls.filter((call) => call.op === "insert");
    expect(inserts.map((call) => call.table)).toEqual(["wavelengths", "questions"]);
    expect(inserts[0]!.payload).toEqual({ participant_a_id: "user-a" });
    expect(inserts[1]!.payload).toEqual(
      GETTING_TO_KNOW_EACH_OTHER_QUESTIONS.map((question, index) => ({
        wavelength_id: "new-draft",
        category: question.category,
        type: question.type,
        text: question.text,
        options: question.options,
        order_index: index,
      })),
    );
    expect(calls).toContainEqual({
      table: "rpc",
      op: "set_wavelength_source_game",
      payload: { p_id: "new-draft", p_source_game_id: "getting-to-know-you" },
    });
  });

  it("resumes an existing draft for the same game without writing anything", async () => {
    existingDraft = { id: "earlier-draft" };
    expect(await start("getting-to-know-you")).toBe("/create?game=getting-to-know-you");
    expect(calls.filter((call) => call.op !== "select")).toEqual([]);
  });

  it("still has its questions, so the start action can seed it", () => {
    expect(getReadyMadeGame("getting-to-know-you")?.questions).toBe(
      GETTING_TO_KNOW_EACH_OTHER_QUESTIONS,
    );
  });
});

describe("startReadyMadeGame: 36 Questions to Fall in Love", () => {
  it("seeds a new fixed draft with the 36 questions in order, as open questions", async () => {
    expect(await start("36-questions-to-fall-in-love")).toBe(
      "/create?game=36-questions-to-fall-in-love",
    );

    const inserts = calls.filter((call) => call.op === "insert");
    expect(inserts.map((call) => call.table)).toEqual(["wavelengths", "questions"]);
    expect(inserts[0]!.payload).toEqual({
      participant_a_id: "user-a",
      source_game_id: "36-questions-to-fall-in-love",
      fixed_question_count: 36,
    });
    expect(inserts[1]!.payload).toEqual(
      conversationQuestionTexts(THIRTY_SIX_QUESTIONS).map((text, index) => ({
        wavelength_id: "new-draft",
        category: "relationship",
        type: "open",
        text,
        options: null,
        order_index: index,
      })),
    );
  });

  it("resumes an existing, already-seeded draft without writing anything", async () => {
    existingDraft = { id: "earlier-draft" };
    existingQuestionCount = 36;
    expect(await start("36-questions-to-fall-in-love")).toBe(
      "/create?game=36-questions-to-fall-in-love",
    );
    expect(calls.filter((call) => call.op === "insert")).toEqual([]);
  });
});

describe("startReadyMadeGame: unknown or question-less games", () => {
  it("falls back to /create", async () => {
    expect(await start("not-a-game")).toBe("/create");
    expect(await start("date-night")).toBe("/create");
    expect(calls).toEqual([]);
  });
});
