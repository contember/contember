#!/bin/bash
# Guards engine migration ordering.
#
# Engine migrations (packages/engine-{tenant,system}-api/src/migrations/*.ts) are
# named YYYY-MM-DD-HHMMSS-<name>.ts and applied in that lexicographic order. A PR
# must not introduce a migration that sorts BEFORE the newest migration already
# on the base branch: such a "migration inserted in the past" would replay in a
# different relative order on a fresh DB than on a production DB that already ran
# the later migrations — diverging the two and breaking the snapshot invariant.
#
# This is a pure-git check (no database). For each package it compares the
# migration set in the working tree against the base ref and fails if any NEW
# migration name is <= the base branch's newest migration name.
#
# Usage:
#   ./scripts/migrations/check-migration-order.sh [base-ref]   # default origin/main
set -euo pipefail
export LC_ALL=C   # deterministic byte-order string comparison/sort

BASE="${1:-origin/main}"
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT="$( cd "$DIR/../.." && pwd )"

# YYYY-MM-DD-HHMMSS-<name>.ts — excludes runner.ts / snapshot.ts / index.ts.
pat='^20[0-9][0-9]-[0-9][0-9]-[0-9][0-9]-[0-9]{6}-.*\.ts$'

list_base() {    # $1 = repo-relative migrations dir
	git -C "$ROOT" ls-tree -r --name-only "$BASE" -- "$1" 2>/dev/null \
		| xargs -r -n1 basename | grep -E "$pat" | sort || true
}
list_current() { # $1 = absolute migrations dir
	ls -1 "$1" 2>/dev/null | grep -E "$pat" | sort || true
}

git -C "$ROOT" rev-parse --verify --quiet "$BASE^{commit}" >/dev/null \
	|| { echo "error: base ref '$BASE' not found (fetch it first, e.g. 'git fetch origin main')" >&2; exit 2; }

failed=0
for entry in "engine-tenant-api:tenant" "engine-system-api:system"; do
	pkg="${entry%%:*}"
	reldir="packages/$pkg/src/migrations"

	base_list="$(list_base "$reldir")"
	cur_list="$(list_current "$ROOT/$reldir")"

	base_max="$(printf '%s\n' "$base_list" | grep -c . >/dev/null && printf '%s\n' "$base_list" | tail -n1 || true)"
	if [ -z "$base_max" ]; then
		echo "→ [$pkg] no migrations on $BASE — skipping"
		continue
	fi

	# new = present now but not on the base ref
	new_migrations="$(comm -13 <(printf '%s\n' "$base_list") <(printf '%s\n' "$cur_list") | grep -E "$pat" || true)"
	if [ -z "$new_migrations" ]; then
		echo "✓ [$pkg] no new migrations vs $BASE"
		continue
	fi

	pkg_failed=0
	while IFS= read -r m; do
		[ -z "$m" ] && continue
		if [[ ! "$m" > "$base_max" ]]; then
			echo "✗ [$pkg] new migration '$m' sorts at or before base newest '$base_max'" >&2
			pkg_failed=1
		fi
	done <<< "$new_migrations"

	if [ "$pkg_failed" -eq 0 ]; then
		count="$(printf '%s\n' "$new_migrations" | grep -c .)"
		echo "✓ [$pkg] $count new migration(s) all sort after '$base_max'"
	else
		failed=1
	fi
done

if [ "$failed" -ne 0 ]; then
	echo >&2
	echo "A new migration must sort AFTER every migration already on the base branch." >&2
	echo "Give it a current timestamp: YYYY-MM-DD-HHMMSS-<name>.ts" >&2
fi
exit "$failed"
