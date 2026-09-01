#!/usr/bin/env bash
# initdb trusts replication connections from localhost only, and the entrypoint's
# POSTGRES_HOST_AUTH_METHOD line does not cover them - the `replication` keyword is its own database
# in pg_hba. Without this the standby cannot even take its base backup.
set -eu

echo 'host replication all all trust' >> "$PGDATA/pg_hba.conf"
