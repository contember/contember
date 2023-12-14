#!/usr/bin/env bash
set -e

# get package name from arg
PACKAGE_NAME=$1
# copy packages/.template to packages/$PACKAGE_NAME
cp -r packages/.template packages/$PACKAGE_NAME

# replace @contember/.template with @contember/$PACKAGE_NAME in package.sjon and tests/example.test.ts
sed -i "s/@.template/$PACKAGE_NAME/g" packages/$PACKAGE_NAME/package.json
sed -i "s/.template/$PACKAGE_NAME/g" packages/$PACKAGE_NAME/tests/example.test.ts

yarn
yarn tsx ./scripts/dev/update-tsconfig.ts
yarn tsx ./scripts/dev/update-dockerfile.ts
