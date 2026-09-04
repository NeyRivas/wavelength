import { describe, expect, it, vi } from "vitest";

import { ensureAnonymousSession, type MinimalAuthClient } from "../../lib/supabase/client";

function fakeClient(user: { id: string } | null, error: { message: string } | null = null) {
  const getUser = vi.fn().mockResolvedValue({ data: { user }, error });
  const signInAnonymously = vi.fn().mockResolvedValue({ data: { user: null }, error: null });
  const client: MinimalAuthClient = { auth: { getUser, signInAnonymously } };
  return { client, getUser, signInAnonymously };
}

describe("ensureAnonymousSession (client-side identity backstop)", () => {
  it("does nothing when a session already exists", async () => {
    const { client, signInAnonymously } = fakeClient({ id: "abc-123" });
    await ensureAnonymousSession(client);
    expect(signInAnonymously).not.toHaveBeenCalled();
  });

  it("signs in anonymously when there is no session", async () => {
    const { client, signInAnonymously } = fakeClient(null);
    await ensureAnonymousSession(client);
    expect(signInAnonymously).toHaveBeenCalledOnce();
  });

  it("signs in anonymously when the existing session fails to revalidate", async () => {
    const { client, signInAnonymously } = fakeClient(null, { message: "expired" });
    await ensureAnonymousSession(client);
    expect(signInAnonymously).toHaveBeenCalledOnce();
  });
});
