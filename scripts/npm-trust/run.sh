#!/bin/bash
set -e

REPO="contember/contember-oss"
WORKFLOW="publish.yaml"

for dir in packages/*; do
  if [ -f "$dir/package.json" ]; then
    if ! grep -q '"private": true' "$dir/package.json"; then
      name=$(node -e "console.log(require('./$dir/package.json').name)")
      echo "Setting trusted publisher for $name..."
      npm trust github "$name" --file="$WORKFLOW" --repository="$REPO" --yes
    fi
  fi
done
