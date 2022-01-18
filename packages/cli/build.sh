#!/bin/bash
set -e

mkdir dist
yarn install
yarn build
yarn esbuild ./packages/cli/src/run.ts \
	--bundle --platform=node --sourcemap=external \
	--external:pg-native --external:electron --external:typescript --external:ts-node \
	--outfile=./dist/run.js
cd dist
echo "{}" > package.json
yarn add typescript@^4.3.5 add ts-node@^10.2.0
