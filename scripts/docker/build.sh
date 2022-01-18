#!/bin/bash
set -euo pipefail

ALL_VERSIONS=($DOCKER_TAGS)

if [[ -z "$1" || "$1" == "engine-alpine" ]]; then
	REPO="contember/engine"
	TAGS=""
	for VERSION in "${ALL_VERSIONS[@]}"; do TAGS="$TAGS -t $REPO:$VERSION"; done
	docker buildx build --platform linux/amd64,linux/arm64 --push $TAGS -f ./packages/engine-server/alpine.dockerfile .
fi

if [[ -z "$1" || "$1" == "engine-debian" ]]; then
	REPO="contember/engine"
	TAGS=""
	for VERSION in "${ALL_VERSIONS[@]}"; do TAGS="$TAGS -t $REPO:$VERSION-debian"; done
	docker buildx build --platform linux/amd64,linux/arm64 --push $TAGS -f ./packages/engine-server/debian.dockerfile .
fi

if [[ -z "$1" || "$1" == "cli" ]]; then
	REPO="contember/cli"
	TAGS="-t $REPO:latest"
	for VERSION in "${ALL_VERSIONS[@]}"; do TAGS="$TAGS -t $REPO:$VERSION"; done
	docker buildx build --platform linux/amd64,linux/arm64 --push $TAGS -f ./packages/cli/Dockerfile .
fi
