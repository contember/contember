#!/bin/bash
set -e

# Regenerate codegen barrels (graphql-client-tenant/-system) before bundling:
# their src/generated is assume-unchanged, so the committed copy can lag the
# tenant SDL and miss newly added operations (e.g. updateIDP). Mirrors the
# `bun run pre-build` that regular CI runs before building.
bun run pre-build

mkdir --parent dist
bun run --filter=@contember/cli build
NODE_ENV=production bun build --target=node --conditions=typescript --external=esbuild --sourcemap=linked --env=disable ./packages/cli/src/run.ts --outdir=dist
cd dist
echo "{}" > package.json

if [[ "$@" == *"--esbuild"* ]]; then
  bun add esbuild@^0.21.5
fi


