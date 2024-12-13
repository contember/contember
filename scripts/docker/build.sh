#!/bin/bash
set -euo pipefail

ALL_VERSIONS=($DOCKER_TAGS)

if [[ -z "$1" || "$1" == "engine-alpine" ]]; then
	REPO="contember/engine"
	TAGS=""
	for VERSION in "${ALL_VERSIONS[@]}"; do TAGS="$TAGS -t $REPO:$VERSION"; done
	docker buildx build \
		--platform linux/amd64,linux/arm64 \
		--push $TAGS \
		-f ./scripts/docker/server-alpine.dockerfile \
		.
fi

if [[ -z "$1" || "$1" == "engine-debian" ]]; then
	REPO="contember/engine"
	TAGS=""
	for VERSION in "${ALL_VERSIONS[@]}"; do TAGS="$TAGS -t $REPO:$VERSION-debian"; done
	docker buildx build \
		--platform linux/amd64,linux/arm64 \
		--push $TAGS \
		-f ./scripts/docker/server-debian.dockerfile \
		.
fi

if [[ -z "$1" || "$1" == "cli" ]]; then
	REPO="contember/cli"

	TAGS=""
	for VERSION in "${ALL_VERSIONS[@]}"; do TAGS="$TAGS -t $REPO:$VERSION"; done
	docker buildx build --platform linux/amd64,linux/arm64 --push $TAGS -f ./scripts/cli-docker-build/bun.dockerfile .


	TAGS=""
  for VERSION in "${ALL_VERSIONS[@]}"; do TAGS="$TAGS -t $REPO:$VERSION-node"; done
  docker buildx build --platform linux/amd64,linux/arm64 --push $TAGS -f ./scripts/cli-docker-build/node.dockerfile .
fi
