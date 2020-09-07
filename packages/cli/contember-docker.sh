#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

IMAGE="contember/cli:latest"

if [[ -f "`pwd`/node_modules/.bin/contember" && -x "$(command -v npx)" ]]; then
	echo "Using local Contember CLI"
	npx contember "$@"
else
	docker run -ti --network host --rm \
	   -v "$(pwd)":"$(pwd)" --workdir="$(pwd)" -v /var/run/docker.sock:/var/run/docker.sock \
	  "$IMAGE" "$@"
fi

