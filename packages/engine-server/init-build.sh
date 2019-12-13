#!/usr/bin/env sh
set -e

npx lerna bootstrap \
  --ignore @contember/admin \
  --ignore @contember/admin-server \
  --ignore @contember/benchmark \
  --ignore @contember/client \
  --ignore @contember/cli \
  --ignore @contember/database-tester \
  --ignore @contember/engine-api-tester \
  --ignore @contember/react-multipass-rendering \
  --ignore @contember/ui \
  --ci -- --no-optional --production


rm -rf packages/*/node_modules/.bin
rm -rf packages/*/dist/**/tsconfig.tsbuildinfo
find packages/*/dist -type f -name '*.map' -exec rm -r {} +

SYMLINKS=$(find ./packages/engine-server/node_modules/@contember -maxdepth 1 -type l)

for SYMLINK in $SYMLINKS; do
	REALPATH=$(readlink -f $SYMLINK)
	rm $SYMLINK
	rm -rf $REALPATH/node_modules/@contember
	if [ -e $REALPATH/node_modules ]; then
	  cp -Rn $REALPATH/node_modules ./packages/engine-server/
	fi
	rm -rf $REALPATH/node_modules
	cp -R $REALPATH $SYMLINK
done
