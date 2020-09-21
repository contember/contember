#!/bin/bash
set -euo pipefail

ECR="831119889470.dkr.ecr.eu-central-1.amazonaws.com"

ecr-login

if [[ $VERSION =~ ^v((([0-9]+)\.([0-9]+))\.[0-9]+)$ ]]; then
  ALL_VERSIONS=( "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}" )
  NEWER_MINOR=$((${BASH_REMATCH[4]} + 1))
  REGEX="^v${BASH_REMATCH[3]}\.${NEWER_MINOR}\.[0-9]+$"
  GIT_TAGS=$(git tag -l)
  NEWER_VERSIONS=$(echo "$GIT_TAGS" | grep -E "$REGEX" || true )
  if [ "${#NEWER_VERSIONS}" -eq 0 ]; then
    ALL_VERSIONS+=( "${BASH_REMATCH[3]}" )
  fi
else
  ALL_VERSIONS=( "$VERSION" )
fi
MAIN_VERSION=${ALL_VERSIONS[0]}

REPO="mangoweb/contember/admin"
docker build -t "$ECR/$REPO:$MAIN_VERSION" -f ./packages/admin-server/Dockerfile .
for VERSION in "${ALL_VERSIONS[@]:1}"
do
  docker tag "$ECR/$REPO:$MAIN_VERSION" "$ECR/$REPO:$VERSION"
done
docker push "$ECR/$REPO"
