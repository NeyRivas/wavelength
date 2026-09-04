import { Client } from "pg";

// TEST-ONLY connection helpers for the RLS integration suite. See
// auth-stub.sql for why a native local Postgres (rather than the full
// Supabase/Docker stack) is a legitimate stand-in here.

const APP_CONNECTION_STRING =
  process.env.TEST_DATABASE_URL ??
  "postgresql://app_authenticator:wavelength_test_app_pw@127.0.0.1:5432/wavelength_test";

const ADMIN_CONNECTION_STRING =
  process.env.TEST_ADMIN_DATABASE_URL ??
  "postgresql://postgres:wavelength_test_admin_pw@127.0.0.1:5432/wavelength_test";

export type SimulatedRole = "anon" | "authenticated";

/**
 * Runs `fn` inside one Postgres session whose role and `auth.uid()` are set
 * exactly the way PostgREST sets them for a real request: `SET ROLE <role>`
 * plus the `request.jwt.claims` GUC carrying the caller's `sub`. Each call
 * is one simulated HTTP request and commits on success (so a later call can
 * see an earlier one's writes, the way two real requests would) — a thrown
 * error (e.g. an RLS rejection) rolls back automatically.
 */
export async function asRequest<T>(
  userId: string | null,
  fn: (client: Client) => Promise<T>,
  opts: { role?: SimulatedRole } = {},
): Promise<T> {
  const role: SimulatedRole = opts.role ?? (userId ? "authenticated" : "anon");
  const client = new Client({ connectionString: APP_CONNECTION_STRING });
  await client.connect();
  try {
    await client.query("begin");
    await client.query(`set local role ${role}`);
    const claims = userId ? JSON.stringify({ sub: userId, role }) : "";
    await client.query("select set_config('request.jwt.claims', $1, true)", [claims]);
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (err) {
    await client.query("rollback").catch(() => undefined);
    throw err;
  } finally {
    await client.end();
  }
}

/**
 * Runs `fn` as the Postgres superuser — bypasses RLS entirely. Used only to
 * prove the state-transition trigger is a genuine second, independent layer
 * of defense (ARCHITECTURE.md §6): even a caller with no RLS restriction at
 * all still cannot force an illegal state transition, because the trigger
 * itself rejects it. Never used to assert what a normal participant can do —
 * that's what `asRequest` is for.
 */
export async function asAdmin<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: ADMIN_CONNECTION_STRING });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

/** Wipes all product + auth.users data. Call between tests for isolation. */
export async function resetDatabase(): Promise<void> {
  const client = new Client({ connectionString: ADMIN_CONNECTION_STRING });
  await client.connect();
  try {
    await client.query("truncate wavelengths, questions, answers cascade");
    await client.query("truncate auth.users cascade");
  } finally {
    await client.end();
  }
}

/** A fresh random UUID that is NOT registered in auth.users — for asserting
 * that a spoofed/unknown participant id is rejected, not merely absent. */
export function randomUserId(): string {
  return crypto.randomUUID();
}

/** Registers a fake anonymous auth user, mirroring what Supabase's real
 * `signInAnonymously()` creates in `auth.users` before any product row can
 * reference it (wavelengths.participant_a_id has a FK to auth.users). */
export async function createTestUser(): Promise<string> {
  const client = new Client({ connectionString: ADMIN_CONNECTION_STRING });
  await client.connect();
  try {
    const { rows } = await client.query<{ id: string }>(
      "insert into auth.users default values returning id",
    );
    const id = rows[0]?.id;
    if (!id) throw new Error("failed to create test user");
    return id;
  } finally {
    await client.end();
  }
}
