#!/bin/bash
set -e

mkdir --parent dist
NODE_ENV=production bun build --target=node --conditions=typescript --external=esbuild --sourcemap=linked --env=disable ./packages/engine-server/src/start.ts --outdir=dist
#bun workspaces focus --production @contember/engine-server
