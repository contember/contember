#!/usr/bin/env bash
set -e

if [ ! -d "./packages/$1" ]; then
  echo "Directory ./packages/$1 does not exist"
  exit 1
fi

DOCKER_BUILDKIT=1 docker build --build-arg PACKAGE="$1" --file ./scripts/graphql-codegen/Dockerfile --output ./packages/$1/src .
