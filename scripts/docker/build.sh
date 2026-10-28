#!/bin/bash
set -euo pipefail

ALL_VERSIONS=($DOCKER_TAGS)

if [[ -z "$1" || "$1" == "engine" ]]; then

	REPO="contember/engine"

	TAGS=""
	for VERSION in "${ALL_VERSIONS[@]}"; do TAGS="$TAGS -t $REPO:$VERSION-node-debian"; done

	docker buildx build \
		--platform linux/amd64,linux/arm64 \
		--push $TAGS \
		-f ./scripts/docker/server-node-debian.dockerfile \
		.

	REPO="contember/engine"

	TAGS=""
	for VERSION in "${ALL_VERSIONS[@]}"; do TAGS="$TAGS -t $REPO:$VERSION-node-alpine -t $REPO:$VERSION"; done

	docker buildx build \
		--platform linux/amd64,linux/arm64 \
		--push $TAGS \
		-f ./scripts/docker/server-node-alpine.dockerfile \
		.

	REPO="contember/engine"

	TAGS=""
	for VERSION in "${ALL_VERSIONS[@]}"; do TAGS="$TAGS -t $REPO:$VERSION-bun-debian"; done

	docker buildx build \
		--platform linux/amd64,linux/arm64 \
		--push $TAGS \
		-f ./scripts/docker/server-bun-debian.dockerfile \
		.

	REPO="contember/engine"

	TAGS=""
	for VERSION in "${ALL_VERSIONS[@]}"; do TAGS="$TAGS -t $REPO:$VERSION-bun-alpine"; done

	docker buildx build \
		--platform linux/amd64,linux/arm64 \
		--push $TAGS \
		-f ./scripts/docker/server-bun-alpine.dockerfile \
		.

fi

if [[ -z "$1" || "$1" == "cli" ]]; then

	REPO="contember/cli"

	# `latest` follows npm: only the newest stable release of the newest major takes it.
	IS_LATEST=$([[ "${NPM_TAG-}" == "latest" ]] && echo 1 || echo "")

	TAGS=""
	for VERSION in "${ALL_VERSIONS[@]}"; do TAGS="$TAGS -t $REPO:$VERSION"; done
	if [[ -n "$IS_LATEST" ]]; then TAGS="$TAGS -t $REPO:latest"; fi

	docker buildx build \
	  --platform linux/amd64,linux/arm64 \
	  --push $TAGS \
	  -f ./scripts/docker/cli-bun.dockerfile \
	  .

	TAGS=""
  for VERSION in "${ALL_VERSIONS[@]}"; do TAGS="$TAGS -t $REPO:$VERSION-node"; done
  if [[ -n "$IS_LATEST" ]]; then TAGS="$TAGS -t $REPO:latest-node"; fi

  docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --push $TAGS \
    -f ./scripts/docker/cli-node.dockerfile \
    .

fi
