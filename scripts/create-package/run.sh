#!/bin/bash
set -euo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PACKAGE_NAME=$1

# Copy the template directory
cp -r scripts/create-package/template packages/$PACKAGE_NAME

# Determine the OS and set sed flags
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  SED_FLAGS=(-i '')
else
  # Linux
  SED_FLAGS=(-i)
fi

# Update placeholders in package.json and example.test.ts
sed "${SED_FLAGS[@]}" "s/.template/$PACKAGE_NAME/g" packages/$PACKAGE_NAME/package.json
sed "${SED_FLAGS[@]}" "s/.template/$PACKAGE_NAME/g" packages/$PACKAGE_NAME/tests/example.test.ts

# Run yarn commands
yarn
yarn tsx "$DIR/update-tsconfig.ts"
