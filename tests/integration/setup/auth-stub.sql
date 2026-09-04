-- TEST-ONLY infrastructure. NOT a Supabase migration and NOT applied to any
-- real project — a real Supabase project already provides the `auth` schema,
-- `auth.uid()`, and the `anon`/`authenticated` roles out of the box.
--
-- This sandbox has no Docker daemon, so the full local Supabase stack
-- (`supabase start`) cannot run here. Postgres itself is otherwise identical,
-- so this file reproduces just enough of Supabase's real `auth` schema and
-- PostgREST's per-request execution model — a `sub` claim in the
-- `request.jwt.claims` session GUC, and a `SET ROLE` to `anon`/`authenticated`
-- before each request — for our migrations' RLS policies and triggers to be
-- exercised with the exact same semantics they'll see in production. See
-- ARCHITECTURE.md §10 for why this is a legitimate stand-in for the RLS layer
-- specifically (it does not, and is not meant to, stand in for
-- PostgREST/GoTrue/Storage or anything beyond Postgres+RLS).

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  is_anonymous boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid;
$$;

create or replace function auth.role()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    current_setting('role', true)
  );
$$;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
end
$$;
