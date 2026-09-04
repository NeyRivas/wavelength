-- TEST-ONLY: run after auth-stub.sql + the real migrations are applied to
-- wavelength_test. Grants app_authenticator membership in anon/authenticated
-- so `SET ROLE` (per-request, mirroring PostgREST) works — see db.ts.
grant anon to app_authenticator;
grant authenticated to app_authenticator;
