#!/bin/bash
set -e
echo "registry=https://registry.npmjs.org/
//registry.npmjs.org/:_authToken=$NPM_AUTH_TOKEN" > ~/.npmrc
