#!/usr/bin/env bash
# TEST-ONLY. Boots a disposable local Postgres database for the RLS
# integration suite and applies: the test-only auth stub, the real product
# migrations (supabase/migrations, unmodified), then test-only grants.
# See auth-stub.sql for why this is a legitimate stand-in for the RLS layer
# specifically, in a sandbox with no Docker daemon to run the full Supabase
# stack.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/../../../supabase/migrations"
DB_NAME="wavelength_test"

if ! su postgres -c "pg_ctlcluster 16 main status" >/dev/null 2>&1; then
  su postgres -c "pg_ctlcluster 16 main start"
fi

for _ in $(seq 1 30); do
  if su postgres -c "pg_isready -q" >/dev/null 2>&1; then break; fi
  sleep 0.5
done

su postgres -c "psql -v ON_ERROR_STOP=1 -f '$SCRIPT_DIR/bootstrap.sql'"

su postgres -c "psql -v ON_ERROR_STOP=1 -d '$DB_NAME' -f '$SCRIPT_DIR/auth-stub.sql'"

for f in "$MIGRATIONS_DIR"/*.sql; do
  echo "applying migration: $(basename "$f")"
  su postgres -c "psql -v ON_ERROR_STOP=1 -d '$DB_NAME' -f '$f'"
done

su postgres -c "psql -v ON_ERROR_STOP=1 -d '$DB_NAME' -f '$SCRIPT_DIR/grants.sql'"

echo "wavelength_test ready on 127.0.0.1:5432"
