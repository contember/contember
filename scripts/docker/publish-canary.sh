#!/bin/bash
set -euo pipefail

docker login --username $DOCKER_USER --password $DOCKER_PASSWORD
bash scripts/docker/build-canary.sh
