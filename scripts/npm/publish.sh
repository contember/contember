#!/bin/bash
set -e

echo "registry=https://registry.npmjs.org/
//registry.npmjs.org/:_authToken=$NPM_AUTH_TOKEN
access=public" > ~/.npmrc

pnpm config set git-tag-version false
pnpm recursive exec npm version "$1"
pnpm recursive publish --access public --no-git-checks
