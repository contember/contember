#!/bin/bash
set -e

bun run ./scripts/npm-publish/resolve-workspaces.ts

for dir in packages/*; do
  if [ -f "$dir/package.json" ]; then
    if ! grep -q '"private": true' "$dir/package.json"; then
      (cd "$dir" && npm publish --tag "$NPM_TAG" --access public --provenance)
    fi
  fi
done
