#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
NO_COLOR='\033[0m'

pnpm run eslint:lint && \
pnpm run build && \
pnpm run build:api:dev && \
pnpm run test && \
echo -e "\n\n${GREEN}All checks passed${NO_COLOR}" || echo -e "\n\n${RED}Some checks failed. See above.${NO_COLOR}"
