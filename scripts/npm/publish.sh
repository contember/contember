#!/bin/bash
set -e

npx lerna publish from-git --yes --registry=https://verdaccio.mgw.cz/
