#!/bin/bash
set -e

mkdir dist
yarn install
yarn esbuild ./packages/cli/src/run.ts \
	--bundle --platform=node --sourcemap=external \
	--external:pg-native --external:electron \
	--outfile=./dist/run.js
cd dist
echo "{}" > package.json
yarn add typescript
