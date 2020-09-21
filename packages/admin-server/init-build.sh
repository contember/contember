#!/usr/bin/env sh

NODE_ENV=development npm ci
npx lerna bootstrap --scope @contember/admin-server --ci -- --production --no-optional

set -e

find ./packages/*/node_modules -type d -name typescript -exec rm -rf "{}" +
SYMLINKS=$(find ./packages/admin-server/node_modules -maxdepth 2 -type l)

for SYMLINK in $SYMLINKS; do
	REALPATH=$(readlink -f $SYMLINK)
	rm $SYMLINK
	cp -RL $REALPATH $SYMLINK
done
