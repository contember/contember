#!/bin/bash
set -e
echo "registry=https://registry.npmjs.org/
//registry.npmjs.org/:_authToken=$NPM_AUTH_TOKEN
access=public" > ~/.npmrc

yarn oao all -i sandbox "yarn publish --tag $NPM_TAG --access public"
