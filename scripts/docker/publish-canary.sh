#!/bin/bash
set -euo pipefail

bash scripts/docker/build-canary.sh
docker login --username $DOCKER_USER --password $DOCKER_PASSWORD
docker push --all-tags "contember/engine"
docker push --all-tags "contember/cli"
