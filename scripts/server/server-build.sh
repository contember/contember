#!/bin/bash
set -e

mkdir --parent server
yarn install
node $SERVER_DIR/esbuild.js
cd server
echo "{}" > package.json
yarn add bcrypt heapdump
