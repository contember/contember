#!/bin/bash
set -euo pipefail
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

PACKAGE_NAME=$1
cp -r scripts/create-package/template packages/$PACKAGE_NAME

sed -i "s/.template/$PACKAGE_NAME/g" packages/$PACKAGE_NAME/package.json
sed -i "s/.template/$PACKAGE_NAME/g" packages/$PACKAGE_NAME/tests/example.test.ts

yarn
yarn tsx "$DIR/update-tsconfig.ts"
