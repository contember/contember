#!/bin/bash
set -e

cd "$(git rev-parse --show-toplevel)"

# Committed codegen output that the build rewrites locally (graphql-client-*
# barrels, the embedded panel assets). Assume-unchanged keeps the regenerated
# copy out of `git status` and out of accidental commits. Idempotent - re-run
# after a `git checkout` drops the bit.
git ls-files -z 'packages/*/src/generated/*' | xargs -0 git update-index --assume-unchanged

echo "Marked generated files as assume-unchanged:"
git ls-files -v 'packages/*/src/generated/*' | grep '^h ' | cut -c3-
