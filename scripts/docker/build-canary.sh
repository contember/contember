#!/bin/bash
set -euo pipefail

REPO="contember/engine"
docker build -t "$REPO:canary-$VERSION" -f ./packages/engine-server/alpine.dockerfile .

docker build -t "$REPO:canary-$VERSION-debian" -f ./packages/engine-server/debian.dockerfile .

REPO="contember/cli"
docker build -t "$REPO:canary-$VERSION" -f ./packages/cli/Dockerfile .
