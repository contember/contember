#!/bin/bash
set -e

for dir in packages/*; do
  if [ -f "$dir/package.json" ]; then
    if ! grep -q '"private": true' "$dir/package.json"; then
      name=$(node -p "require('./$dir/package.json').name")
      version=$(node -p "require('./$dir/package.json').version")
      # Let a re-run finish a partially published release instead of dying on the
      # first EPUBLISHCONFLICT. A failed `npm view` (404, network) publishes anyway.
      if npm view "$name@$version" version >/dev/null 2>&1; then
        echo "Skipping $name@$version, already on the registry."
        continue
      fi
      (cd "$dir" && npm publish "$(bun pm pack | grep '\.tgz$')" --tag "$NPM_TAG" --access public --provenance)
    fi
  fi
done
