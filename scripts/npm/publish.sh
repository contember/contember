#!/bin/bash
set -e

# Trusted publishing: npm authenticates the workflow through OIDC, so no token is needed.
# yarn 3 cannot publish that way, so yarn packs each workspace (resolving `workspace:` ranges)
# and npm publishes the tarball with provenance.
for dir in packages/* ee/*; do
	if [ -f "$dir/package.json" ]; then
		if ! grep -q '"private": true' "$dir/package.json"; then
			name=$(node -p "require('./$dir/package.json').name")
			version=$(node -p "require('./$dir/package.json').version")
			# Let a re-run finish a partially published release. A failed `npm view` (404, network) publishes anyway.
			if npm view "$name@$version" version >/dev/null 2>&1; then
				echo "Skipping $name@$version, already on the registry."
				continue
			fi
			(cd "$dir" && yarn pack --out package.tgz && npm publish package.tgz --tag "$NPM_TAG" --access public --provenance && rm package.tgz)
		fi
	fi
done
