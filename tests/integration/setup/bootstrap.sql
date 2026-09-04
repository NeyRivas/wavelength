-- TEST-ONLY bootstrap: creates a disposable local role/db used exclusively by
-- `pnpm test:integration`. Not part of the product; nothing here is applied
-- to a real Supabase project. Passwords are fixed, throwaway values scoped to
-- an ephemeral local Postgres cluster — not secrets.

alter role postgres password 'wavelength_test_admin_pw';

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'app_authenticator') then
    -- Mirrors Supabase/PostgREST's own "authenticator" role: LOGIN, NOINHERIT,
    -- and a member of anon/authenticated so a request-scoped `SET ROLE` (see
    -- tests/integration/setup/db.ts) fully switches privilege context to
    -- whichever role a given request should run as — never accidentally
    -- inheriting broader rights.
    create role app_authenticator login password 'wavelength_test_app_pw' noinherit;
  end if;
end
$$;

drop database if exists wavelength_test;
create database wavelength_test;
