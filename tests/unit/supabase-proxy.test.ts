import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getUser = vi.fn();
const signInAnonymously = vi.fn();
const createServerClientMock = vi.fn((..._args: unknown[]) => ({
  auth: { getUser, signInAnonymously },
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: (...args: unknown[]) => createServerClientMock(...args),
}));

const { updateSession } = await import("../../lib/supabase/proxy");

function makeRequest(): NextRequest {
  return new NextRequest("https://app.example.com/");
}

beforeEach(() => {
  getUser.mockReset();
  signInAnonymously.mockReset().mockResolvedValue({ data: { user: null }, error: null });
  createServerClientMock.mockClear();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
});

describe("updateSession", () => {
  it("does not sign in anonymously when a valid session already exists", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "abc" } }, error: null });

    const response = await updateSession(makeRequest());

    expect(signInAnonymously).not.toHaveBeenCalled();
    expect(response).toBeDefined();
  });

  it("establishes an anonymous session on first visit (no session at all)", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    await updateSession(makeRequest());

    expect(signInAnonymously).toHaveBeenCalledOnce();
  });

  it("establishes a fresh anonymous session when the existing one is invalid/expired", async () => {
    getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "refresh token expired" },
    });

    await updateSession(makeRequest());

    expect(signInAnonymously).toHaveBeenCalledOnce();
  });

  it("does not crash and skips Supabase entirely when env vars are missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const response = await updateSession(makeRequest());

    expect(response).toBeDefined();
    expect(createServerClientMock).not.toHaveBeenCalled();
    expect(getUser).not.toHaveBeenCalled();
  });
});
