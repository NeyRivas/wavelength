# Wavelength

"Are we on the same wavelength?" — a shared two-person questionnaire experience. Full product spec and technical architecture: [`ARCHITECTURE.md`](./ARCHITECTURE.md).

Stack: Next.js (App Router) + TypeScript + Supabase (Postgres + Auth + RLS). No accounts/passwords/email — participants are identified by a Supabase Anonymous Auth session per browser (see `ARCHITECTURE.md` §4).

## Status

Phase 0 (scaffolding) and Phase 1 (database, RLS, state integrity) are complete. No UI or participant flows are implemented yet — see `ARCHITECTURE.md` §12 for the phase plan.

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in your Supabase project's URL/anon key
pnpm dev
```

## Scripts

| Command                        | Does                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `pnpm dev`                     | Run the Next.js app locally                                                                                |
| `pnpm build`                   | Production build                                                                                           |
| `pnpm lint`                    | ESLint                                                                                                     |
| `pnpm typecheck`               | `tsc --noEmit`                                                                                             |
| `pnpm format` / `format:write` | Prettier check / write                                                                                     |
| `pnpm test:unit`               | Vitest unit suite (`tests/unit`)                                                                           |
| `pnpm test:integration`        | Vitest RLS/state-machine integration suite against a real local Postgres (`tests/integration`) — see below |
| `pnpm test`                    | Everything                                                                                                 |

## Database

The schema, RLS policies, RPC functions, and integrity triggers live in `supabase/migrations/` (applied in filename order). They're written for a real Supabase project — nothing in that directory is test-only.

`pnpm test:integration` proves the critical authorization and state-machine rules against those exact migration files, run on a native local Postgres 16 instance (this sandbox has no Docker daemon, so the full `supabase start` stack isn't available here — see `tests/integration/setup/auth-stub.sql` for what stands in for it and why that's a faithful substitute for RLS testing specifically). It boots and tears the test database down automatically; no setup needed beyond having PostgreSQL 16 installed locally.
