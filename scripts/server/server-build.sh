#!/bin/bash
set -e

mkdir --parent server
bun install
bun packages/engine-server/esbuild.cjs
bun install --production
#bun workspaces focus --production @contember/engine-server
