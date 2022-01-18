#!/bin/bash
set -e

mkdir dist
yarn install
node packages/cli/esbuild.js
cd dist
echo "{}" > package.json
yarn add typescript@^4.3.5 add ts-node@^10.2.0
