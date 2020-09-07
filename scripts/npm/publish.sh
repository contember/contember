#!/bin/bash
set -e
echo "registry=https://registry.npmjs.org/
//registry.npmjs.org/:_authToken=$NPM_AUTH_TOKEN
access=public" > ~/.npmrc

NPM_TAG="next"
if [[ $VERSION =~ ^v((([0-9]+)\.([0-9]+))\.[0-9]+)$ ]]; then
	NPM_TAG="latest"
fi

npx oao all npm publish --tag $NPM_TAG
