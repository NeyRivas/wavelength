import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// Freezes the approved "36 Questions to Fall in Love" experience exactly as
// rendered: its landing page and metadata, the shared content in B's
// invitation context, and B's real invitation page. Complements
// thirty-six-questions-page.test.ts / thirty-six-questions-invite.test.ts
// (which check specific behavior) and protected-content.test.ts (which
// freezes the stages and questions themselves).
//
// If one of these snapshots fails, the change touched the approved 36
// Questions experience. Don't update the snapshot unless that change was
// explicitly approved.

vi.mock("@/app/actions/ready-made-games", () => ({ startReadyMadeGame: async () => {} }));
vi.mock("@/app/actions/join", () => ({
  claimParticipantB: async () => ({ error: null }),
  submitFinalB: async () => ({ error: null }),
}));
vi.mock("next/font/google", () => {
  const font = () => ({ variable: "font", className: "font", style: {} });
  return { Fraunces: font, Nunito_Sans: font };
});
vi.mock("@/lib/supabase/identity", () => ({ requireUserId: async () => "visitor-b" }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => {
    const query = {
      select: () => query,
      eq: () => query,
      maybeSingle: async () => ({ data: null }),
    };
    return {
      from: () => query,
      rpc: async () => ({
        data: [{ state: "WAITING", participant_a_alias: "Alex", is_taken: false }],
      }),
    };
  },
}));

describe("36 Questions: frozen as approved", () => {
  it("landing page metadata", async () => {
    const { metadata } =
      await import("../../app/play/dating-couples/36-questions-to-fall-in-love/page");
    expect(metadata).toMatchSnapshot();
  });

  it("landing page HTML", async () => {
    const { default: Page } =
      await import("../../app/play/dating-couples/36-questions-to-fall-in-love/page");
    expect(renderToStaticMarkup(createElement(Page))).toMatchSnapshot();
  });

  it("experience content in B's invitation context", async () => {
    const { ThirtySixQuestionsContent } =
      await import("../../components/conversation/thirty-six-questions-content");
    expect(
      renderToStaticMarkup(createElement(ThirtySixQuestionsContent, { context: "invite" })),
    ).toMatchSnapshot();
  });

  it("B's invitation page for a 36 Questions link", async () => {
    const { default: WavelengthPage } = await import("../../app/w/[token]/page");
    const element = await WavelengthPage({
      params: Promise.resolve({ token: "0123456789abcdef0123456789abcdef" }),
      searchParams: Promise.resolve({ game: "36-questions-to-fall-in-love" }),
    });
    expect(renderToStaticMarkup(element)).toMatchSnapshot();
  });
});
