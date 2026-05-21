#!/bin/bash
# Regenerates the migrations snapshot (engine-tenant-api / engine-system-api).
#
# The snapshot is a pg_dump of the schema produced by running ALL migrations from
# scratch. The migrations runner uses it to bootstrap a fresh database in one step
# instead of replaying every migration, so it MUST stay in sync with the migrations.
# Re-run this whenever you add or change a migration.
#
# Usage:
#   ./scripts/create-migrations-snapshot/run.sh tenant
#   ./scripts/create-migrations-snapshot/run.sh system
#
# Requirements:
#   - a running postgres container (`docker compose up -d postgres`)
#   - local `bun` + `bun install` already run in this checkout
#
# Worktree-friendly: migrations run via local `bun` against THIS checkout's code
# (not whatever the engine container has mounted), and the postgres container is
# auto-discovered by its compose label — so it works from any worktree regardless
# of which compose project is up. Override the container with SNAPSHOT_PG_CONTAINER.
set -euo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT="$( cd "$DIR/../.." && pwd )"
TYPE="${1:-}"

die() { echo "error: $*" >&2; exit 1; }

case "$TYPE" in
	tenant)
		PKG="engine-tenant-api"; SCHEMA="tenant"
		EXTRA_EXCLUDES=()
		UUID_SED=()
		;;
	system)
		PKG="engine-system-api"; SCHEMA="system"
		EXTRA_EXCLUDES=()
		# The system runner resolves uuid generation at runtime (built-in gen_random_uuid
		# on modern PG, else the migration-provided uuid_generate_v4 fallback). So in the
		# snapshot we (a) drop the fallback function's own definition entirely — keeping it
		# would redefine gen_random_uuid on modern PG — and (b) rewrite every remaining
		# reference to the ${randomUuidFn} placeholder. `--exclude-table` does NOT cover
		# functions, hence the range-delete in sed below.
		UUID_SED=(-e '/^CREATE FUNCTION "uuid_generate_v4"/,/\$\$;/d' -e 's/"uuid_generate_v4"/"${randomUuidFn}"/g')
		;;
	"")
		die "missing type. Usage: $0 <tenant|system>" ;;
	*)
		die "invalid type: '$TYPE'. Usage: $0 <tenant|system>" ;;
esac

MIG_DIR="$ROOT/packages/$PKG/src/migrations"
RUNNER="$ROOT/packages/$PKG/src/bin/runMigrations.ts"
SNAPSHOT="$MIG_DIR/snapshot.ts"
DB="migration_snapshot"

# --- locate a running postgres container (any compose project / worktree) ---
PG_CONTAINER="${SNAPSHOT_PG_CONTAINER:-$(docker ps --filter "label=com.docker.compose.service=postgres" --format '{{.Names}}' | head -n1)}"
[ -n "$PG_CONTAINER" ] || die "no running postgres container found. Start it with: docker compose up -d postgres (or set SNAPSHOT_PG_CONTAINER)"

# host-mapped port so local bun can reach postgres (compose maps 5432 to a host port)
PG_PORT="$(docker port "$PG_CONTAINER" 5432/tcp 2>/dev/null | head -n1 | sed 's/.*://')"
[ -n "$PG_PORT" ] || die "postgres container '$PG_CONTAINER' does not publish port 5432 to the host"

PG_USER="${SNAPSHOT_PG_USER:-contember}"
PG_PASSWORD="${SNAPSHOT_PG_PASSWORD:-contember}"

echo "→ postgres container: $PG_CONTAINER (host port $PG_PORT)"
echo "→ regenerating $SCHEMA snapshot from $ROOT"

# 1. fresh database
docker exec -e PGUSER="$PG_USER" "$PG_CONTAINER" \
	bash -c "dropdb --if-exists --username \"$PG_USER\" $DB && createdb --username \"$PG_USER\" $DB" >/dev/null

# 2. run ALL migrations from THIS checkout (CONTEMBER_MIGRATIONS_NO_SNAPSHOT skips the snapshot fast-path)
( cd "$ROOT" && \
	PGUSER="$PG_USER" PGPASSWORD="$PG_PASSWORD" PGDATABASE="$DB" PGHOST=127.0.0.1 PGPORT="$PG_PORT" CONTEMBER_MIGRATIONS_NO_SNAPSHOT=1 \
	bun --conditions=typescript "$RUNNER" )

# 3. dump the resulting schema and assemble snapshot.ts
cat "$MIG_DIR/snapshot-template-start.txt" > "$SNAPSHOT"
docker exec -e PGUSER="$PG_USER" "$PG_CONTAINER" \
	pg_dump --serializable-deferrable --no-owner --no-acl --schema-only \
		--schema="$SCHEMA" --quote-all-identifiers \
		--exclude-table="$SCHEMA.migrations" --exclude-table="$SCHEMA.migrations_id_seq" "${EXTRA_EXCLUDES[@]}" \
		--dbname="$DB" --username="$PG_USER" \
	| sed -E \
		-e '/^--/d' \
		-e '/^SET /d' \
		-e '/SET "search_path"/d' \
		-e '/^SELECT pg_catalog\.set_config/d' \
		-e '/^\\(un)?restrict/d' \
		-e '/^CREATE SCHEMA /d' \
		-e '/^COMMENT ON SCHEMA /d' \
		-e "s/\"$SCHEMA\"\\.//g" \
		"${UUID_SED[@]}" \
		-e '/^$/d' >> "$SNAPSHOT"
cat "$MIG_DIR/snapshot-template-end.txt" >> "$SNAPSHOT"

# 4. clean up + format so the result is commit-ready
docker exec -e PGUSER="$PG_USER" "$PG_CONTAINER" bash -c "dropdb --if-exists --username \"$PG_USER\" $DB" >/dev/null
( cd "$ROOT" && bun run format "$SNAPSHOT" >/dev/null 2>&1 || true )

echo "✓ wrote $SNAPSHOT"
echo "  review: git diff -- ${SNAPSHOT#"$ROOT"/}"
