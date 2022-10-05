#!/bin/bash
set -euo pipefail

docker-compose exec -T db \
    bash -c "dropdb --if-exists --username \${POSTGRES_USER} tenant_migrations"
docker-compose exec -T db \
    bash -c "createdb --username \${POSTGRES_USER} tenant_migrations"

docker-compose exec -T -e PGUSER=contember -e PGPASSWORD=contember -e PGDATABASE=tenant_migrations -e PGHOST=db -e CONTEMBER_MIGRATIONS_NO_SNAPSHOT=1 api \
	bash -c "node ./packages/engine-tenant-api/dist/src/bin/runMigrations.js"

cat ./packages/engine-tenant-api/src/migrations/snapshot-template-start.txt > ./packages/engine-tenant-api/src/migrations/snapshot.ts

docker-compose exec -T db \
	bash -c "pg_dump -v --serializable-deferrable --no-owner --no-acl --dbname=tenant_migrations --username=\${POSTGRES_USER} --schema-only --schema=tenant --exclude-table=tenant.migrations --quote-all-identifiers  --exclude-table=tenant.migrations_id_seq" \
	| sed -e '/^--/d' -e 's/"tenant"\.//g' -e '1,32d' -e '/^$/d' >> ./packages/engine-tenant-api/src/migrations/snapshot.ts

cat ./packages/engine-tenant-api/src/migrations/snapshot-template-end.txt >> ./packages/engine-tenant-api/src/migrations/snapshot.ts
