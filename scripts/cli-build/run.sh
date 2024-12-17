#!/bin/bash
set -e

mkdir --parent dist
bun install
bun run --filter=@contember/cli build
bun build --target=node --conditions=typescript --external=esbuild --sourcemap=linked --env=disable ./packages/cli/src/run.ts --outdir=dist
cd dist
echo "{}" > package.json

if [[ "$@" == *"--esbuild"* ]]; then
  bun add esbuild@^0.21.5
fi

