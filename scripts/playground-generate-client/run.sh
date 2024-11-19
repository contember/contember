#!/bin/bash
set -euo pipefail

docker compose run --rm --entrypoint="" cli sh -c "
bun --conditions=typescript /src/packages/cli/src/run.ts project:print-schema --format=schema > /tmp/contember-schema.json
bun --conditions=typescript /src/packages/client-content-generator/src/generate.ts /tmp/contember-schema.json /src/packages/playground/api/client/
rm /tmp/contember-schema.json
"
