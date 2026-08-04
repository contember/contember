#!/bin/bash
set -e

mkdir --parent dist

# The panel UI is embedded into the bundle (the runtime image holds nothing but dist/start.js), so it
# has to be built first. Done here rather than relying on `bun run pre-build`, because the engine
# dockerfiles call this script directly.
bun run --filter=@contember/engine-panel pre-build

NODE_ENV=production bun build --target=node --conditions=typescript --external=esbuild --sourcemap=linked --env=disable ./packages/engine-server/src/start.ts --outdir=dist
#bun workspaces focus --production @contember/engine-server
