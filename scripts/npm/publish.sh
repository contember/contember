#!/bin/bash
set -e
echo "registry=https://registry.npmjs.org/
//registry.npmjs.org/:_authToken=$NPM_AUTH_TOKEN
access=public" > ~/.npmrc

yarn workspaces foreach -pt --no-private exec "yarn npm publish --tag $NPM_TAG --access public"
