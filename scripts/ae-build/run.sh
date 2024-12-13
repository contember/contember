#!/usr/bin/env bash
set -e

mkdir -p dist/types
echo "export {}" > dist/types/index.d.ts
node scripts/ae-build/run.js "$@"
