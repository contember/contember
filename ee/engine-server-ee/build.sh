#!/bin/bash
set -e

mkdir --parent server
yarn install
node ee/engine-server-ee/esbuild.js
cd server
echo "{}" > package.json
echo "" > yarn.lock
yarn add heapdump
