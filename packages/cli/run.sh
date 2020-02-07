#!/bin/bash
set -euo pipefail

if [[ -f "`pwd`/node_modules/.bin/contember" ]]; then
	echo "Using local Contember CLI"
	npx contember "$@"
else
	node /opt/contember/dist/src/run.js "$@"
fi

