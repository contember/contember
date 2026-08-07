#!/usr/bin/env bash
set -e
bun install
bun pre-build

git update-index --assume-unchanged packages/graphql-client-system/src/generated/Async.ts
git update-index --assume-unchanged packages/graphql-client-system/src/generated/CommonTypes.ts
git update-index --assume-unchanged packages/graphql-client-system/src/generated/enums/index.ts
git update-index --assume-unchanged packages/graphql-client-system/src/generated/fetchers/index.ts
git update-index --assume-unchanged packages/graphql-client-system/src/generated/inputs/index.ts
git update-index --assume-unchanged packages/graphql-client-tenant/src/generated/Async.ts
git update-index --assume-unchanged packages/graphql-client-tenant/src/generated/CommonTypes.ts
git update-index --assume-unchanged packages/graphql-client-tenant/src/generated/enums/index.ts
git update-index --assume-unchanged packages/graphql-client-tenant/src/generated/fetchers/index.ts
git update-index --assume-unchanged packages/graphql-client-tenant/src/generated/inputs/index.ts
# Committed as an empty placeholder; the build fills it with the whole panel bundle (~344 kB).
git update-index --assume-unchanged packages/engine-panel/src/generated/assets.ts

test -f docker-compose.override.yaml || cp docker-compose.override.dist.yaml docker-compose.override.yaml
bun contember migrations:execute --yes
docker-compose up -d
