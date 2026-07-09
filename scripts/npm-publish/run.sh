#!/bin/bash
set -e

for dir in packages/*; do
  if [ -f "$dir/package.json" ]; then
    if ! grep -q '"private": true' "$dir/package.json"; then
      (cd "$dir" && npm publish "$(bun pm pack | grep '\.tgz$')" --tag "$NPM_TAG" --access public --provenance)
    fi
  fi
done
