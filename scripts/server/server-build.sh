#!/bin/bash
set -e

mkdir --parent server
yarn install
node packages/engine-server/esbuild.cjs
yarn workspaces focus --production @contember/engine-server
