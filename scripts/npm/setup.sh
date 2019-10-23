#!/bin/bash
set -e
echo "registry=https://registry.npmjs.org/
//verdaccio.mgw.cz/:_authToken=$NPM_AUTH_TOKEN
@contember:registry=https://verdaccio.mgw.cz/" > .npmrc
