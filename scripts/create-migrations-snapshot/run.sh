#!/bin/bash
set -euo pipefail
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

TYPE="$1"


if [ "$TYPE" = "system" ]; then
  docker-compose exec -T db \
      bash -c "dropdb --if-exists --username \${POSTGRES_USER} migration_snapshot"
  docker-compose exec -T db \
      bash -c "createdb --username \${POSTGRES_USER} migration_snapshot"

  docker-compose exec -T -e PGUSER=contember -e PGPASSWORD=contember -e PGDATABASE=migration_snapshot -e PGHOST=db -e CONTEMBER_MIGRATIONS_NO_SNAPSHOT=1 api \
    bash -c "node ./packages/engine-system-api/dist/src/bin/runMigrations.js"

  cat ./packages/engine-system-api/src/migrations/snapshot-template-start.txt > ./packages/engine-system-api/src/migrations/snapshot.ts

  docker-compose exec -T db \
    bash -c "pg_dump -v --serializable-deferrable --no-owner --no-acl --dbname=migration_snapshot --username=\${POSTGRES_USER} --schema-only --schema=system --exclude-table=system.migrations --quote-all-identifiers  --exclude-table=system.migrations_id_seq --exclude-table=system.uuid_generate_v4" \
    | sed -e '1,30d'  -e '/^--/d' -e '/^SET /d' -e 's/"system"\.//g' -e 's/"uuid_generate_v4"/"${randomUuidFn}"/g' -e '/^$/d' -e '/SET "search_path"/d' >> ./packages/engine-system-api/src/migrations/snapshot.ts

  cat ./packages/engine-system-api/src/migrations/snapshot-template-end.txt >> ./packages/engine-system-api/src/migrations/snapshot.ts


elif [ "$TYPE" = "tenant" ]; then
  docker-compose exec -T db \
      bash -c "dropdb --if-exists --username \${POSTGRES_USER} migration_snapshot"
  docker-compose exec -T db \
      bash -c "createdb --username \${POSTGRES_USER} migration_snapshot"

  docker-compose exec -T -e PGUSER=contember -e PGPASSWORD=contember -e PGDATABASE=migration_snapshot -e PGHOST=db -e CONTEMBER_MIGRATIONS_NO_SNAPSHOT=1 api \
    bash -c "node ./packages/engine-tenant-api/dist/src/bin/runMigrations.js"

  cat ./packages/engine-tenant-api/src/migrations/snapshot-template-start.txt > ./packages/engine-tenant-api/src/migrations/snapshot.ts

  docker-compose exec -T db \
    bash -c "pg_dump -v --serializable-deferrable --no-owner --no-acl --dbname=migration_snapshot --username=\${POSTGRES_USER} --schema-only --schema=tenant --exclude-table=tenant.migrations --quote-all-identifiers  --exclude-table=tenant.migrations_id_seq" \
    | sed  -e '1,32d' -e '/^--/d' -e 's/"tenant"\.//g' -e '/^SET /d' -e '/SET "search_path"/d' -e '/^$/d' >> ./packages/engine-tenant-api/src/migrations/snapshot.ts

  cat ./packages/engine-tenant-api/src/migrations/snapshot-template-end.txt >> ./packages/engine-tenant-api/src/migrations/snapshot.ts

else
  echo "Invalid type: $TYPE"
  exit 1

fi
