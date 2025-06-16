#!/bin/bash
set -e

if [[ $# -ne 1 ]]; then
    echo "Usage: $0 <version>"
    exit 1
fi

version=$1

# Validate the semver format using a regex
if ! [[ $version =~ ^([0-9]+\.){2}[0-9]+(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$ ]]; then
    echo "Invalid semver: $version"
    exit 1
fi

if git rev-parse -q --verify "refs/tags/v$version" >/dev/null; then
    echo "Error: Version $version matches an existing Git tag."
    exit 1
fi


# Check for modified or untracked files
if [[ -n $(git status --porcelain) ]]; then
  echo "There are modified or untracked files in the repository."
  exit 1
fi

current_branch=$(git symbolic-ref --short HEAD)
if [[ "$current_branch" != "main" && ! "$current_branch" =~ ^v[0-9]+\.[0-9]+$ ]]; then
    echo "Error: You must be on either the main branch or a version branch (e.g., v1.2)."
    exit 1
fi

# Validate that the local branch is up to date with origin
git fetch origin "$current_branch"
local_commit=$(git rev-parse "$current_branch")
remote_commit=$(git rev-parse "origin/$current_branch")
if [[ "$local_commit" != "$remote_commit" ]]; then
    echo "Error: Your $current_branch branch is not up to date with origin/$current_branch."
    exit 1
fi

# If on a version branch, validate that the passed version starts with the branch version
if [[ "$current_branch" =~ ^v[0-9]+\.[0-9]+$ ]]; then
    branch_version=$(echo "$current_branch" | sed 's/^v//')
    if [[ ! "$version" =~ ^$branch_version\..* ]]; then
        echo "Error: The passed version ($version) must start with the branch version ($branch_version)."
        exit 1
    fi
fi

bun run ./scripts/tag-version/bump-version.ts "$@"

# https://github.com/oven-sh/bun/issues/18906
docker run -v `pwd`:/src --workdir /src oven/bun:1.2.7 bun install

git add .
git commit -m "v$1"
git tag "v$1"
git push origin "$current_branch"
git push origin "v$1"
