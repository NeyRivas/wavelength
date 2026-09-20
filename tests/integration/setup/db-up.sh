#!/usr/bin/env bash
# TEST-ONLY. Boots a disposable local Postgres database for the RLS
# integration suite and applies: the test-only auth stub, the real product
# migrations (supabase/migrations, unmodified), then test-only grants.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/../../../supabase/migrations"
DB_NAME="wavelength_test"

if ! pg_isready -q; then
  echo "PostgreSQL is not running. Start it with: brew services start postgresql@16"
  exit 1
fi

psql -v ON_ERROR_STOP=1 -d postgres -f "$SCRIPT_DIR/bootstrap.sql"

psql -v ON_ERROR_STOP=1 -d "$DB_NAME" -f "$SCRIPT_DIR/auth-stub.sql"

for f in "$MIGRATIONS_DIR"/*.sql; do
  echo "applying migration: $(basename "$f")"
  psql -v ON_ERROR_STOP=1 -d "$DB_NAME" -f "$f"
done

psql -v ON_ERROR_STOP=1 -d "$DB_NAME" -f "$SCRIPT_DIR/grants.sql"

echo "wavelength_test ready on 127.0.0.1:5432"
