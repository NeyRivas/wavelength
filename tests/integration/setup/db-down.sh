#!/usr/bin/env bash
# TEST-ONLY teardown: drops the disposable test database. The shared local
# Postgres cluster itself is left running (starting/stopping the whole
# cluster is slow and the sandbox is ephemeral anyway).
set -euo pipefail

su postgres -c "psql -v ON_ERROR_STOP=1 -c \"drop database if exists wavelength_test;\""
