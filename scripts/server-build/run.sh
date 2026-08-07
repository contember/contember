#!/bin/bash
set -e

# Regenerate the codegen barrels (graphql-client-tenant/-system/-actions) before anything consumes
# them: `src/generated` is committed as stubs, and panel-ui imports the fetchers as values, so a
# clean checkout would bundle `undefined` and crash at runtime. Mirrors cli-build/run.sh.
bun run pre-build

mkdir --parent dist

# The panel UI is embedded into the bundle (the runtime image holds nothing but dist/start.js), so it
# has to be built first. Deliberately not a `pre-build` script of its own: the root `pre-build` fans
# out to every package, which would make the CLI image build a panel it cannot use and tie it to
# panel-ui failing.
bun run --filter=@contember/engine-panel build:assets

NODE_ENV=production bun build --target=node --conditions=typescript --external=esbuild --sourcemap=linked --env=disable ./packages/engine-server/src/start.ts --outdir=dist
#bun workspaces focus --production @contember/engine-server
