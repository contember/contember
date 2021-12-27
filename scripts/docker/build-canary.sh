#!/bin/bash
set -euo pipefail

REPO="contember/engine"
docker buildx build --platform linux/amd64,linux/arm64 --push -t "$REPO:canary-$VERSION" -f ./packages/engine-server/alpine.dockerfile .

docker buildx build --platform linux/amd64,linux/arm64 --push -t "$REPO:canary-$VERSION-debian" -f ./packages/engine-server/debian.dockerfile .

REPO="contember/cli"
docker buildx build --platform linux/amd64,linux/arm64 --push -t "$REPO:canary-$VERSION" -f ./packages/cli/Dockerfile .
