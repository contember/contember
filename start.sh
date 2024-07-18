#!/usr/bin/env bash

yarn install
yarn pre-build
test -f docker-compose.override.yaml || cp docker-compose.override.dist.yaml docker-compose.override.yaml
yarn contember migrations:execute --yes
docker-compose up -d
