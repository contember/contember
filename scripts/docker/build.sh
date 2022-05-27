#!/bin/bash
set -euo pipefail

tar czf yarn.tar.gz -C "$(yarn cache dir)" .

ALL_VERSIONS=($DOCKER_TAGS)

if [[ -z "$1" || "$1" == "engine-alpine" ]]; then
	REPO="contember/engine"
	TAGS=""
	for VERSION in "${ALL_VERSIONS[@]}"; do TAGS="$TAGS -t $REPO:$VERSION"; done
	docker buildx build \
		--build-arg LICENSE_FILE=LICENSE \
		--build-arg SERVER_DIR=packages/engine-server \
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
		--build-arg LICENSE_FILE=LICENSE \
		--build-arg SERVER_DIR=packages/engine-server \
		--platform linux/amd64,linux/arm64 \
		--push $TAGS \
		-f ./scripts/docker/server-debian.dockerfile \
		.
fi

if [[ -z "$1" || "$1" == "engine-ee-alpine" ]]; then
	REPO="contember/engine-ee"
	TAGS=""
	for VERSION in "${ALL_VERSIONS[@]}"; do TAGS="$TAGS -t $REPO:$VERSION"; done
	docker buildx build \
		--build-arg LICENSE_FILE=ee/LICENSE \
		--build-arg SERVER_DIR=ee/engine-server-ee \
		--platform linux/amd64,linux/arm64 \
		--push $TAGS \
		-f ./scripts/docker/server-debian.dockerfile \
		.
fi

if [[ -z "$1" || "$1" == "engine-ee-debian" ]]; then
	REPO="contember/engine-ee"
	TAGS=""
	for VERSION in "${ALL_VERSIONS[@]}"; do TAGS="$TAGS -t $REPO:$VERSION-debian"; done
	docker buildx build \
		--build-arg LICENSE_FILE=ee/LICENSE \
		--build-arg SERVER_DIR=ee/engine-server-ee \
		--platform linux/amd64,linux/arm64 \
		--push $TAGS \
		-f ./scripts/docker/server-alpine.dockerfile \
		.
fi

if [[ -z "$1" || "$1" == "cli" ]]; then
	REPO="contember/cli"
	TAGS="-t $REPO:latest"
	for VERSION in "${ALL_VERSIONS[@]}"; do TAGS="$TAGS -t $REPO:$VERSION"; done
	docker buildx build --platform linux/amd64,linux/arm64 --push $TAGS -f ./packages/cli/Dockerfile .
fi
