import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { conversationQuestionTexts } from "../../lib/wavelength/conversation-experiences";

// "36 Questions to Fall in Love" shown to B: the shared experience content
// in its two contexts, and B's real invitation page (/w/[token]) with the
// database mocked out.

vi.mock("@/app/actions/ready-made-games", () => ({ startReadyMadeGame: async () => {} }));
vi.mock("@/app/actions/join", () => ({
  claimParticipantB: async () => ({ error: null }),
  submitFinalB: async () => ({ error: null }),
}));
vi.mock("next/font/google", () => {
  const font = () => ({ variable: "font", className: "font", style: {} });
  return { Fraunces: font, Nunito_Sans: font };
});

// What the pre-claim preview RPC returns for this test's share link.
let preview: { state: string; participant_a_alias: string; is_taken: boolean } | null;

vi.mock("@/lib/supabase/identity", () => ({ requireUserId: async () => "visitor-b" }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => {
    // B isn't a participant yet, so the RLS-scoped wavelength lookup finds
    // nothing; only the safe preview RPC answers.
    const query = {
      select: () => query,
      eq: () => query,
      maybeSingle: async () => ({ data: null }),
    };
    return {
      from: () => query,
      rpc: async () => ({ data: preview ? [preview] : [] }),
    };
  },
}));

const GAME = "36-questions-to-fall-in-love";

async function renderContent(context: "landing" | "invite") {
  const { ThirtySixQuestionsContent } =
    await import("../../components/conversation/thirty-six-questions-content");
  return renderToStaticMarkup(createElement(ThirtySixQuestionsContent, { context }));
}

async function renderInvitePage(game?: string) {
  const { default: WavelengthPage } = await import("../../app/w/[token]/page");
  const element = await WavelengthPage({
    params: Promise.resolve({ token: "0123456789abcdef0123456789abcdef" }),
    searchParams: Promise.resolve(game ? { game } : {}),
  });
  return renderToStaticMarkup(element);
}

const textOf = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

describe("ThirtySixQuestionsContent", () => {
  it("renders the same sections and all 36 questions in both contexts", async () => {
    for (const context of ["landing", "invite"] as const) {
      const html = await renderContent(context);
      for (const heading of [
        "Where the idea comes from",
        "How to play",
        "The three stages",
        "Ready when you are",
        "Questions people ask",
        "More for the two of you",
      ]) {
        expect(html, `${context}: ${heading}`).toContain(heading);
      }
      for (const question of conversationQuestionTexts(
        (await import("../../lib/wavelength/conversation-experiences")).THIRTY_SIX_QUESTIONS,
      )) {
        expect(html).toContain(question.replace(/'/g, "&#x27;"));
      }
    }
  });

  it("landing context: unchanged — an h1 and two CTAs that start the experience", async () => {
    const html = await renderContent("landing");
    expect(html.match(/<h1[^>]*>/g)).toHaveLength(1);
    expect(html.match(/name="gameId" value="36-questions-to-fall-in-love"/g)).toHaveLength(2);
    expect(html).not.toContain("#join-alias");
    expect(html).not.toContain('target="_blank"');
  });

  it("invite context: no h1, no way to start a new questionnaire, CTAs lead back to the invitation", async () => {
    const html = await renderContent("invite");
    expect(html).not.toMatch(/<h1[\s>]/);
    expect(html).toMatch(/<h2[^>]*>36 Questions to Fall in Love<\/h2>/);
    expect(html).not.toContain('name="gameId"');
    // "Start the experience" survives only as How to play's step 1 title,
    // never as a control.
    expect(html).not.toMatch(/<form[\s>]/);
    expect(html).not.toMatch(/<button[^>]*>\s*Start the experience/);
    expect(html.match(/href="#join-alias"/g)).toHaveLength(2);
    expect(textOf(html)).toContain("Join the conversation");
    expect(textOf(html)).toContain("Add your name above");
  });

  it("keeps the related experiences' titles and destinations; opens them in a new tab only for B", async () => {
    const landing = await renderContent("landing");
    const invite = await renderContent("invite");
    for (const [href, title] of [
      [
        "/play/dating-couples/getting-to-know-each-other-questions",
        "Getting to know each other questions",
      ],
      ["/play/dating-couples/date-night", "Date Night"],
      ["/play/dating-couples", "Are we on the same page?"],
    ]) {
      for (const html of [landing, invite]) {
        expect(html).toContain(`href="${href}"`);
        expect(html).toContain(title);
      }
    }
    expect(invite.match(/target="_blank" rel="noopener noreferrer"/g)).toHaveLength(3);
    expect(invite.match(/\(opens in a new tab\)/g)).toHaveLength(3);
    // Eyebrows come from the Couples catalog's own card subtitles.
    for (const eyebrow of [
      "Discovery &amp; Conversation",
      "Conversation Starters",
      "Compatibility Quiz",
    ]) {
      expect(landing).toContain(eyebrow);
    }
  });
});

describe("B's invitation page (/w/[token])", () => {
  beforeEach(() => {
    preview = { state: "WAITING", participant_a_alias: "Alex", is_taken: false };
  });

  it("shows the unchanged invitation first, then the full experience", async () => {
    const html = await renderInvitePage(GAME);
    const invitation = html.indexOf("You&#x27;ve been invited");
    const nameField = html.indexOf('id="join-alias"');
    const experience = html.indexOf("Where the idea comes from");

    expect(invitation).toBeGreaterThan(-1);
    expect(nameField).toBeGreaterThan(invitation);
    expect(experience).toBeGreaterThan(nameField);
    expect(html).toContain("Alex has answered 36 questions");
    expect(html).toContain("Start answering");
    // The invitation keeps the page's only h1.
    expect(html.match(/<h1[^>]*>/g)).toHaveLength(1);
    expect(html).not.toContain('name="gameId"');
  });

  it("shows only the invitation for other experiences or a link without the game hint", async () => {
    for (const game of [undefined, "getting-to-know-you"]) {
      const html = await renderInvitePage(game);
      expect(html).toContain('id="join-alias"');
      expect(html).not.toContain("Where the idea comes from");
    }
  });

  it("adds nothing once the invitation is already taken", async () => {
    preview = { state: "IN_PROGRESS", participant_a_alias: "Alex", is_taken: true };
    const html = await renderInvitePage(GAME);
    expect(html).not.toContain('id="join-alias"');
    expect(html).not.toContain("Where the idea comes from");
  });
});
