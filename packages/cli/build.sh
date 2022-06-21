#!/bin/bash
set -e

mkdir --parent dist
yarn install
yarn workspace @contember/cli build
node packages/cli/esbuild.js
cd dist
echo "{}" > package.json
yarn add esbuild@^0.14.14 vm2@^3.9.9
