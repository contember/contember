#!/usr/bin/env bash

NODE_ENV=development yarn vite build --mode development --config scripts/vite/vite.build.ts
yarn vite build --mode production --config scripts/vite/vite.build.ts

# in ./dist, there will be development and production builds for each package, we need to copy to individual packages
# so ./dist/production/react-binding will be copied to ./packages/react-binding/dist/production

for package in dist/development/*; do
  package_name=$(basename $package)
  if [ $package_name = "_virtual" ]; then
    continue
  fi

  mkdir -p packages/$package_name/dist/development
  mkdir -p packages/$package_name/dist/production
  cp -r dist/development/$package_name/* packages/$package_name/dist/development
  cp -r dist/production/$package_name/* packages/$package_name/dist/production
done
