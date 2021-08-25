#!/bin/bash
set -euo pipefail

ALL_VERSIONS=($DOCKER_TAGS)

MAIN_VERSION=${ALL_VERSIONS[0]}

REPO="contember/contember"
docker build -t "$REPO:$MAIN_VERSION" -f ./packages/engine-server/alpine.dockerfile .
for VERSION in "${ALL_VERSIONS[@]:1}"
do
  docker tag "$REPO:$MAIN_VERSION" "$REPO:$VERSION"
done

docker build -t "$REPO:$MAIN_VERSION-debian" -f ./packages/engine-server/debian.dockerfile .
for VERSION in "${ALL_VERSIONS[@]:1}"
do
  docker tag "$REPO:$MAIN_VERSION-debian" "$REPO:$VERSION-debian"
done

REPO="contember/cli"
docker build -t "$REPO:$MAIN_VERSION" -f ./packages/cli/Dockerfile .
for VERSION in "${ALL_VERSIONS[@]:1}"
do
  docker tag "$REPO:$MAIN_VERSION" "$REPO:$VERSION"
done
docker tag "$REPO:$MAIN_VERSION" "$REPO:latest"

