#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

IMAGE="contember/cli:latest"

if [[ -f "`pwd`/node_modules/.bin/contember" ]]; then
	echo "Using local Contember CLI"
	npx contember "$@"
else
	echo "Using docker Contember CLI"
	docker run -ti --network host --rm \
	  -v "$(pwd)":/src -v /var/run/docker.sock:/var/run/docker.sock \
	  "$IMAGE" "$@"
fi

