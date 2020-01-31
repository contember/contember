#!/bin/bash
set -euo pipefail

docker login --username $DOCKER_USER --password $DOCKER_PASSWORD
apk --no-cache add git bash
bash scripts/docker/build.sh
