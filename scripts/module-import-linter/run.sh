#!/bin/bash
set -euo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# check if "bun" binary is available
if command -v bun &> /dev/null
then
    bun "$DIR/linter.ts"
    exit
fi

yarn tsx "$DIR/linter.ts"
