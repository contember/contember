#!/bin/bash
set -e

mkdir --parent server
yarn install
node packages/engine-server/esbuild.js
cd server
echo "{}" > package.json
yarn add bcrypt heapdump
