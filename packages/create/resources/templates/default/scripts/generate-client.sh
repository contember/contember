#!/usr/bin/env bash

docker-compose run --rm --entrypoint="" contember-cli sh -c "
bun /opt/contember/run.js project:print-schema --format=schema > /tmp/contember-schema.json
bun run --silent contember-client-generator /tmp/contember-schema.json ./client/src
rm /tmp/contember-schema.json
"
