#!/bin/bash
set -euo pipefail

ALL_VERSIONS=($DOCKER_TAGS)

REPO="contember/engine"
TAGS=""
for VERSION in "${ALL_VERSIONS[@]}"; do TAGS="$TAGS -t $REPO:$VERSION"; done
docker buildx build --platform linux/amd64,linux/arm64 --push $TAGS -f ./packages/engine-server/alpine.dockerfile .

REPO="contember/engine"
TAGS=""
for VERSION in "${ALL_VERSIONS[@]}"; do TAGS="$TAGS -t $REPO:$VERSION-debian"; done
docker buildx build --platform linux/amd64,linux/arm64 --push $TAGS -f ./packages/engine-server/debian.dockerfile .

REPO="contember/cli"
TAGS="-t $REPO:latest"
for VERSION in "${ALL_VERSIONS[@]}"; do TAGS="$TAGS -t $REPO:$VERSION"; done
docker buildx build --platform linux/amd64,linux/arm64 --push $TAGS -f ./packages/cli/Dockerfile .
