import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();

vi.mock("../../lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser },
  })),
}));

const { getUserId, requireUserId, UnauthenticatedError } =
  await import("../../lib/supabase/identity");

beforeEach(() => {
  getUser.mockReset();
});

describe("getUserId", () => {
  it("returns the participant id when a session is present", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "abc-123" } }, error: null });
    expect(await getUserId()).toBe("abc-123");
  });

  it("returns null when there is no session", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect(await getUserId()).toBeNull();
  });

  it("returns null (not the stale user) when Supabase reports an error revalidating the token", async () => {
    // getUserId() must trust auth.getUser()'s revalidation, not just
    // whether `data.user` happens to be populated — a revoked/expired
    // session must never be treated as valid just because some cached
    // user object was returned alongside the error.
    getUser.mockResolvedValue({
      data: { user: { id: "stale-user" } },
      error: { message: "invalid or expired token" },
    });
    expect(await getUserId()).toBeNull();
  });
});

describe("requireUserId", () => {
  it("returns the participant id when present", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "abc-123" } }, error: null });
    expect(await requireUserId()).toBe("abc-123");
  });

  it("throws UnauthenticatedError when there is no session", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(requireUserId()).rejects.toThrow(UnauthenticatedError);
  });

  it("throws UnauthenticatedError (not a generic error) so callers can distinguish this case", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: "expired" } });
    const err = await requireUserId().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(UnauthenticatedError);
    expect((err as Error).name).toBe("UnauthenticatedError");
  });
});
