#!/usr/bin/env bash
# TEST-ONLY teardown: drops the disposable test database. The shared local
# Postgres cluster itself is left running.
set -euo pipefail

psql -v ON_ERROR_STOP=1 -d postgres -c "DROP DATABASE IF EXISTS wavelength_test;"
