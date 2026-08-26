# CLAUDE.md

## Project Overview

Contember is an open-source platform for building data-driven web applications. It provides a GraphQL API, role-based access control, authentication, and a well-structured PostgreSQL database. The admin interface is built with React.

This is a monorepo under `packages/`, using **Bun** as the package manager and runtime.

## Common Commands

```bash
# Install dependencies
bun install

# Build
bun run ts:build          # TypeScript compilation (tsc --build)
bun run vite:build        # Vite bundling (ESM + CJS, dev + prod)
bun run build             # Full build (pre-build + panel assets + ts + vite)
bun run panel:assets      # Build panel-ui and embed it into engine-panel's asset map
bun run ts:watch          # Watch mode for TypeScript

# Test
bun run test              # Run all unit/node tests (bun)
bun run test:e2e          # Run e2e tests (no parallelism)
# Run a single test file:
bun test packages/schema-utils/tests/cases/unit/acl.test.ts

# Lint & Format
bun run lint              # Biome linter
bun run lint:fix          # Fix linting issues
bun run format:check      # Check formatting (dprint)
bun run format            # Auto-format (dprint)

# Local dev environment
docker-compose up --detach       # Start postgres, redis, mailhog, object-storage, adminer
docker-compose up engine         # Run engine server (port 4000)

# Fill the local engine with data for every management panel page (idempotent)
bun --conditions=typescript scripts/dev/seed-local.ts

# Create a new package
./scripts/dev/create-package.sh <package-name>
```

## Architecture

### High-Level Overview

- Backend: `engine-server` → `engine-http` → content, system and tenant APIs → database/schema packages.
- Frontend: `interface` → `react-binding` and feature packages → React clients → GraphQL clients.
- Dependency injection follows master → project group → project → execution container scopes.

### Package Groups

- **Engine** (`engine-server`, `engine-http`, `engine-content-api`, `engine-system-api`, `engine-tenant-api`): The backend server. `engine-server` bootstraps and clusters, `engine-http` provides Koa-based HTTP/WebSocket routing and multi-tenant project resolution, the three API packages implement GraphQL resolvers for content CRUD, schema/migration management, and identity/project/membership management.
- **Plugins** (`engine-plugins`, `engine-actions`, `engine-s3-plugin`, `engine-vimeo-plugin`): Plugin interface with hooks at config, schema, execution, and container levels. Actions dispatches entity-change webhooks. S3 provides signed upload/read URLs.
- **Schema** (`schema`, `schema-definition`, `schema-migrations`, `schema-utils`): `schema` is pure types. `schema-definition` provides a decorator-based API for defining entities, relations, ACL, validation, and actions. `schema-migrations` diffs two schema versions and generates ordered modifications that produce SQL. `schema-utils` has validators, visitors, naming conventions, and code generators.
- **Database** (`database`, `database-migrations`, `queryable`): `database` wraps `pg` with fluent immutable query builders (Select/Insert/Update/Delete), connection pooling, transactions with savepoints, advisory locks, and typed error translation.
- **React Binding** (`binding-common`, `binding-legacy`, `react-binding`): The data binding layer. Statically analyzes React component trees to generate GraphQL queries (markers), maintains a normalized TreeStore, collects mutations, and provides EntityAccessor/FieldAccessor/EntityListAccessor hooks.
- **React UI** (`react-form`, `react-dataview`, `react-select`, `react-slate-editor-legacy`, `react-uploader`, `react-repeater`, `react-routing`, `react-identity`): Higher-level UI components that all integrate with react-binding via useField/useEntity/useEntityList hooks and environment extensions.
- **Clients** (`graphql-client`, `client-content`, `client-content-generator`, `client`): `graphql-client` is a fetch-based GraphQL HTTP client. `client-content` provides a typed query/mutation builder with fluent entity selection. `client-content-generator` generates fully-typed TypeScript SDK from schema.
- **CLI** (`cli`, `cli-common`): Commands for deploy, migrations, data transfer, project validation, actions and tenant management. Connects via DSN or env vars.
- **Core** (`dic`, `authorization`, `logger`, `utilities`, `typesafe`): `dic` is a type-safe DI container with builder pattern, lazy resolution, and circular dependency detection. `authorization` uses a composable AccessNode tree (Union/Intersection/Negate/Roles/Fixed) evaluated against a role->resource->privilege permission map.

### Key Architectural Patterns

- **DI Container (dic)**: `new Builder({}).addService('name', deps => ...).build()` — lazy, type-safe, supports replacement via `.replaceService()` with `inner` access to previous implementation.
- **Container Hierarchy**: `MasterContainer` → `ProjectGroupContainer` (per tenant) → `ProjectContainer` (per project) → `ExecutionContainer` (per request).
- **CQRS**: Tenant and System APIs use Command/Query separation with CommandBus.
- **Visitor Pattern**: Used extensively in schema-utils and engine-content-api for field/relation traversal.
- **Marker-based Query Generation**: React binding statically walks JSX to extract field/relation markers, then generates GraphQL queries from the marker tree.
- **ACL Predicate Injection**: Content API injects WHERE clauses derived from role permissions into every SELECT/INSERT/UPDATE/DELETE — row-level and field-level security.

## Build & Package Conventions

- **Dual output**: Each package produces ESM (`.js`) and CommonJS (`.cjs`) in `dist/production/` and `dist/development/`.
- **Conditional exports**: Package.json uses `import`/`require` with `production`/`development` conditions, plus a `typescript` condition pointing to source.
- **TypeScript**: Strict mode, composite builds with project references, `ES2020` target, `bundler` module resolution, experimental decorators enabled. Uses TypeScript 7.0.1-rc.
- **Scoped packages**: All packages are published as `@contember/{name}`.
- **Internal deps**: Use `workspace:*` references; external deps are version-centralized via workspace catalog in root `package.json`.

## Generated Artifacts

Several **tracked** files are build output. Never hand-edit them, and never commit their regenerated form.

| Artifact | Produced by | Committed as |
|---|---|---|
| `packages/graphql-client-{tenant,system,actions}/src/generated` | `bun run pre-build` (from the tenant/system SDL) | small stubs (2–6 lines each) |
| `packages/engine-panel/src/generated/assets.ts` | `bun run panel:assets` | 379-byte stub |
| `packages/engine-{tenant,system}-api/src/schema/index.ts`, `src/migrations/snapshot.ts` | codegen / snapshot scripts | the real file (see the package's CLAUDE.md) |
| `packages/create/resources/templates/default/admin/lib/` | `assemble-ui-lib.mjs` at pre-build | gitignored, not committed at all |

`scripts/setup.sh` marks the stub files **`assume-unchanged`** (`git ls-files -v` shows a lowercase `h`) so local build output stays out of `git status`. Consequences:

- A **fresh worktree does not have that bit**, so after `pre-build` those files show up as modified. That churn is a build artifact — restore it with `git checkout HEAD -- packages/graphql-client-*/src/generated`.
- Mid-rebase this bites hard: *any* unstaged change makes `git rebase --continue` abort with `You must edit all merge conflicts and then mark them as resolved` even though nothing is unmerged and no conflict markers exist. Restore the generated files first, then continue.
- **`git add -f` overrides `assume-unchanged`.** Rewriting history (`git reset` + re-add, squash) therefore commits whatever the working tree holds — after a build that is megabytes of generated client instead of the stub. Tag a backup before any rewrite (`git tag backup/<branch> HEAD`), verify `git diff --stat backup/<branch> HEAD` is empty before pushing, then re-run `bash scripts/setup.sh` to restore the bits.

A bundle entrypoint that imports a generated client must run `pre-build` itself — both `scripts/cli-build/run.sh` and `scripts/server-build/run.sh` do (panel-ui imports the fetchers as values, so a clean checkout would otherwise bundle `undefined`).

## CI

- The `check` job is a **fail-fast matrix** (format, lint, build, test, lint-imports, api-exporter). One failing entry cancels the rest, and `gh pr checks` renders cancelled as `fail`, so a single error looks like five. Read the real conclusions first:
  ```bash
  gh run view <runId> --json jobs -q '.jobs[] | [.conclusion, (.name|gsub("\n";" "))] | @tsv'
  ```
- **`test-db (12..16)` is the e2e suite**, not unit-test shards — one job per PostgreSQL major, each building the server, starting it, and running `bun run test:e2e`. Also fail-fast. See `e2e/CLAUDE.md`.
- `snapshot` verifies the committed tenant/system migration snapshots against a replay of the migrations; `migration-order` rejects a new migration whose filename sorts before the newest one on the base branch (pure git). See `packages/engine-tenant-api/CLAUDE.md`.
- **The workflow triggers on `pull_request`, pushes to `main`, and tags only** (`docs/**`-only PRs are skipped via `paths-ignore`). Pushing a feature branch verifies nothing; open the PR.
- `lint-imports` runs `bunx deptective`, which catches missing workspace dependencies that `tsc` does not — a transitively reachable import typechecks fine and still fails this job.
- `api-exporter` compares `build/api/*.api.md`, which `ts:build` and `test` do NOT regenerate. Changing a public surface (including one *generated* from the tenant SDL) leaves the report stale — run `bun run ae:update` and commit the diff.

## Testing

- **Framework**: `bun test` (Bun's built-in test runner):
  - Browser tests (`react-*`): `happy-dom` environment
  - Node tests (non-React packages): `node` environment
  - E2E tests (`e2e/`): integration against live server
- Test files live in `packages/{name}/tests/` with `*.test.ts` or `*.test.tsx` extension.
- Database tests require PostgreSQL (docker-compose provides it on port 5432, user/pass: `contember`/`contember`).

## Code Style

- **Formatter**: dprint — tabs, single quotes, 150 char line width. It has no markdown plugin, so `format:check` ignores `.md`/`.mdx`.
- **Linter**: Biome — recommended ruleset with project-specific overrides.
- **Import extensions**: relative imports carry an explicit `.js` (`useImportExtensions: error`), directory barrels as `/index.js`. This applies to test files too, which a source-only review easily misses.
- A nested `biome.json` anywhere inside the repo (e.g. a scratch git worktree checked out under the repo root) breaks repo-wide `bun run lint` with "nested root configuration". Lint your files directly (`bunx biome lint <files>`) until it is removed.
- **Commits**: Conventional Commits format, e.g. `fix(content-api): handle null in orderBy`.

## Module-Specific Context

Read the nearest package-level `CLAUDE.md` when present; it provides local invariants and commands.
