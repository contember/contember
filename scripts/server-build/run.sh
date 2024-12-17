#!/bin/bash
set -e

mkdir --parent dist
bun install
bun build --target=node --conditions=typescript --external=esbuild --sourcemap=linked --env=disable ./packages/engine-server/src/start.ts --outdir=dist
#bun workspaces focus --production @contember/engine-server