#!/bin/bash
# Verifies that the committed snapshot.ts is in sync with the migrations.
#
# Strategy (matches packages/engine-tenant-api/CLAUDE.md): bootstrap two fresh
# databases through the REAL migrations runner and compare their schemas —
#   A) CONTEMBER_MIGRATIONS_NO_SNAPSHOT=1  → replays every migration from scratch
#   B) (default)                            → uses the snapshot fast-path
# then schema-only pg_dump both and diff. They MUST be identical; a non-empty diff
# means snapshot.ts drifted from the migrations and must be regenerated with:
#   ./scripts/create-migrations-snapshot/run.sh <tenant|system>
#
# Why diff two live DBs instead of byte-comparing the committed snapshot.ts:
# both dumps come from the SAME pg_dump binary, so client/server version quirks
# (e.g. \restrict lines, formatting) cancel out. A byte-compare against the file
# would flake across pg_dump versions; this checks the invariant we actually care
# about — "snapshot bootstrap == full replay".
#
# Connects via standard PG* env vars, so it runs against a CI postgres service on
# localhost as well as a local db. Override host/port/credentials via env:
#   PGHOST (default 127.0.0.1) PGPORT (5432) PGUSER (contember) PGPASSWORD (contember)
#
# Usage:
#   ./scripts/create-migrations-snapshot/verify.sh            # both tenant + system
#   ./scripts/create-migrations-snapshot/verify.sh tenant
#   ./scripts/create-migrations-snapshot/verify.sh system
set -euo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT="$( cd "$DIR/../.." && pwd )"

export PGHOST="${PGHOST:-127.0.0.1}"
export PGPORT="${PGPORT:-5432}"
export PGUSER="${PGUSER:-contember}"
export PGPASSWORD="${PGPASSWORD:-contember}"

die() { echo "error: $*" >&2; exit 1; }

command -v pg_dump >/dev/null || die "pg_dump not found on PATH (install postgresql-client)"
command -v createdb >/dev/null || die "createdb not found on PATH (install postgresql-client)"

# Normalize a dump so the two bootstraps compare cleanly. Applied IDENTICALLY to
# both sides, so it can only remove constant noise — never hide a real difference.
#   - comments carry the pg_dump version & timestamps; SET / set_config / \restrict
#     are session setup, not schema.
#   - strip the "<schema>." qualifier (constant, and pg_catalog refs are unqualified).
#   - canonicalize uuid generation: replay creates & uses the migration-provided
#     `uuid_generate_v4` fallback, while the snapshot uses built-in `gen_random_uuid`
#     on modern PG (see snapshot-factory.ts / run.sh UUID_SED). That divergence is
#     intentional and functionally equivalent, so we drop the fallback function's
#     definition and map both names to one token before diffing.
normalize() {
	local schema="$1"
	sed -E \
		-e '/^--/d' \
		-e '/^SET /d' \
		-e '/^SELECT pg_catalog\.set_config/d' \
		-e '/^\\(un)?restrict/d' \
		-e "s/\"$schema\"\\.//g" \
		-e '/^CREATE FUNCTION "uuid_generate_v4"\(\)/,/\$\$;/d' \
		-e 's/"uuid_generate_v4"/"__random_uuid__"/g' \
		-e 's/"gen_random_uuid"/"__random_uuid__"/g' \
		-e '/^$/d'
}

dump_schema() {
	local db="$1" schema="$2"
	# exclude the migrations bookkeeping table/seq: replay has many rows & the
	# table is framework-managed, snapshot excludes it too (see run.sh).
	pg_dump --no-owner --no-acl --schema-only --schema="$schema" --quote-all-identifiers \
		--exclude-table="$schema.migrations" --exclude-table="$schema.migrations_id_seq" \
		--dbname="$db" | normalize "$schema"
}

verify_one() {
	local type="$1" pkg schema
	case "$type" in
		tenant) pkg="engine-tenant-api"; schema="tenant" ;;
		system) pkg="engine-system-api"; schema="system" ;;
		*) die "invalid type: '$type' (expected tenant|system)" ;;
	esac

	local runner="$ROOT/packages/$pkg/src/bin/runMigrations.ts"
	local db_replay="snapshot_verify_${type}_replay"
	local db_snapshot="snapshot_verify_${type}_snapshot"

	echo "→ [$type] bootstrapping two fresh databases on $PGHOST:$PGPORT"

	for db in "$db_replay" "$db_snapshot"; do
		dropdb --if-exists "$db" >/dev/null
		createdb "$db" >/dev/null
	done

	# A) full replay of every migration
	( cd "$ROOT" && PGDATABASE="$db_replay" CONTEMBER_MIGRATIONS_NO_SNAPSHOT=1 \
		bun --conditions=typescript "$runner" >&2 )
	# B) snapshot fast-path (fresh DB + no override → applies snapshot.ts only)
	( cd "$ROOT" && PGDATABASE="$db_snapshot" \
		bun --conditions=typescript "$runner" >&2 )

	local diff_out
	if diff_out="$(diff <(dump_schema "$db_replay" "$schema") <(dump_schema "$db_snapshot" "$schema"))"; then
		echo "✓ [$type] snapshot matches migrations"
		dropdb --if-exists "$db_replay" >/dev/null
		dropdb --if-exists "$db_snapshot" >/dev/null
		return 0
	fi

	echo "✗ [$type] snapshot.ts is OUT OF SYNC with the migrations" >&2
	echo "  (< = full replay, > = snapshot fast-path)" >&2
	echo "$diff_out" >&2
	echo >&2
	echo "  regenerate it with: ./scripts/create-migrations-snapshot/run.sh $type" >&2
	dropdb --if-exists "$db_replay" >/dev/null
	dropdb --if-exists "$db_snapshot" >/dev/null
	return 1
}

types=("$@")
[ ${#types[@]} -eq 0 ] && types=(tenant system)

failed=0
for t in "${types[@]}"; do
	verify_one "$t" || failed=1
done

exit "$failed"
