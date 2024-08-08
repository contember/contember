#!/bin/bash
set -euo pipefail

docker-compose exec -T postgres \
    bash -c "dropdb --if-exists --username \${POSTGRES_USER} ${TARGET_DB_NAME}"
docker-compose exec -T postgres \
    bash -c "createdb --username \${POSTGRES_USER} ${TARGET_DB_NAME}"

docker run --rm --init \
    --env PGHOST="$SOURCE_DB_HOST" \
    --env PGDATABASE="$SOURCE_DB_NAME" \
    --env PGUSER="$SOURCE_DB_USER" \
    --env PGPASSWORD="$SOURCE_DB_PASS" \
    --network=host \
    postgres:13-alpine \
    pg_dump -v --serializable-deferrable --no-owner --no-acl | \
docker-compose exec -T postgres \
    bash -c "psql -q -b --username \${POSTGRES_USER} ${TARGET_DB_NAME}"
