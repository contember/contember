#!/bin/bash
set -e

mkdir server
yarn install
yarn run build
yarn esbuild ./packages/engine-server/src/start.ts \
	--bundle --platform=node --sourcemap=external \
	--external:pg-native --external:mock-aws-s3 --external:aws-sdk --external:nock --external:bcrypt \
	--outfile=./server/server.js
cd server
echo "{}" > package.json
yarn add bcrypt
