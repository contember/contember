#!/bin/bash
set -e

yarn config set npmAuthToken "$NPM_AUTH_TOKEN"
yarn workspaces foreach -pt --no-private npm publish --tag $NPM_TAG  --access public
