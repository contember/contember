# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Contember is an open-source platform for building data-driven web applications. It provides a GraphQL API, role-based access control, authentication, and a well-structured PostgreSQL database. The admin interface is built with React.

This is a **monorepo with 72 packages** under `packages/`, using **Bun** as the package manager and runtime.

## Common Commands

```bash
# Install dependencies
bun install

# Build
bun run ts:build          # TypeScript compilation (tsc --build)
bun run vite:build        # Vite bundling (ESM + CJS, dev + prod)
bun run build             # Full build (pre-build + ts + vite)
bun run ts:watch          # Watch mode for TypeScript

# Test
bun run test              # Run all unit/node tests (vitest)
bun run test:e2e          # Run e2e tests (no parallelism)
# Run a single test file:
bunx vitest run packages/schema-utils/tests/cases/unit/acl.test.ts

# Lint & Format
bun run lint              # Biome linter
bun run lint:fix          # Fix linting issues
bun run format:check      # Check formatting (dprint)
bun run format            # Auto-format (dprint)

# Local dev environment
docker-compose up --detach       # Start postgres, redis, mailhog, minio, adminer
docker-compose up engine         # Run engine server (port 4000)

# Create a new package
./scripts/dev/create-package.sh <package-name>
```

## Architecture

### High-Level Overview

```
                          ┌─────────────────────┐
                          │    engine-server     │  Entry point: bootstraps & clusters
                          └──────────┬──────────┘
                                     │
                          ┌──────────┴──────────┐
                          │     engine-http      │  Koa HTTP layer, routing, auth
                          └──┬───────┬────────┬─┘
                             │       │        │
              ┌──────────────┘       │        └──────────────┐
              ▼                      ▼                       ▼
   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
   │engine-content-api│  │engine-system-api │  │engine-tenant-api │
   │ GraphQL CRUD     │  │ Migrations,      │  │ Auth, users,     │
   │ with ACL         │  │ schema, stages   │  │ projects, roles  │
   └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
            │                     │                      │
            └─────────────┬───────┘──────────────────────┘
                          ▼
              ┌───────────────────┐     ┌─────────────────────┐
              │     database      │     │   schema / schema-  │
              │ Query builder,    │     │   definition /      │
              │ pool, transactions│     │   schema-migrations │
              └───────────────────┘     └─────────────────────┘
```

**Frontend stack:**
```
interface (re-exports) ── react-binding ── binding-common / binding-legacy
                        ├── react-form, react-dataview, react-select
                        ├── react-slate-editor-legacy (rich text)
                        ├── react-uploader, react-repeater
                        ├── react-routing, react-identity
                        └── react-client ── client-content ── graphql-client
```

### Package Groups

- **Engine** (`engine-server`, `engine-http`, `engine-content-api`, `engine-system-api`, `engine-tenant-api`): The backend server. `engine-server` bootstraps and clusters, `engine-http` provides Koa-based HTTP/WebSocket routing and multi-tenant project resolution, the three API packages implement GraphQL resolvers for content CRUD, schema/migration management, and identity/project/membership management.
- **Plugins** (`engine-plugins`, `engine-actions`, `engine-s3-plugin`, `engine-vimeo-plugin`): Plugin interface with hooks at config, schema, execution, and container levels. Actions dispatches entity-change webhooks. S3 provides signed upload/read URLs.
- **Schema** (`schema`, `schema-definition`, `schema-migrations`, `schema-utils`): `schema` is pure types. `schema-definition` provides a decorator-based API for defining entities, relations, ACL, validation, and actions. `schema-migrations` diffs two schema versions and generates ordered modifications that produce SQL. `schema-utils` has validators, visitors, naming conventions, and code generators.
- **Database** (`database`, `database-migrations`, `queryable`): `database` wraps `pg` with fluent immutable query builders (Select/Insert/Update/Delete), connection pooling, transactions with savepoints, advisory locks, and typed error translation.
- **React Binding** (`binding-common`, `binding-legacy`, `react-binding`): The data binding layer. Statically analyzes React component trees to generate GraphQL queries (markers), maintains a normalized TreeStore, collects mutations, and provides EntityAccessor/FieldAccessor/EntityListAccessor hooks.
- **React UI** (`react-form`, `react-dataview`, `react-select`, `react-slate-editor-legacy`, `react-uploader`, `react-repeater`, `react-routing`, `react-identity`): Higher-level UI components that all integrate with react-binding via useField/useEntity/useEntityList hooks and environment extensions.
- **Clients** (`graphql-client`, `client-content`, `client-content-generator`, `client`): `graphql-client` is a fetch-based GraphQL HTTP client. `client-content` provides a typed query/mutation builder with fluent entity selection. `client-content-generator` generates fully-typed TypeScript SDK from schema.
- **CLI** (`cli`, `cli-common`): 22 commands for deploy, migrations (diff/execute/amend/rebase/status), data transfer (export/import), project validation, and actions management. Connects via DSN or env vars.
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
- **TypeScript**: Strict mode, composite builds with project references, `ES2020` target, `bundler` module resolution, experimental decorators enabled. Uses TypeScript 6.0.1-rc.
- **Scoped packages**: All packages are published as `@contember/{name}`.
- **Internal deps**: Use `workspace:*` references; external deps are version-centralized via workspace catalog in root `package.json`.

## Testing

- **Framework**: Vitest with three workspaces:
  - Browser tests (`react-*`): `happy-dom` environment
  - Node tests (non-React packages): `node` environment
  - E2E tests (`e2e/`): integration against live server
- Test files live in `packages/{name}/tests/` with `*.test.ts` or `*.test.tsx` extension.
- Database tests require PostgreSQL (docker-compose provides it on port 5432, user/pass: `contember`/`contember`).

## Code Style

- **Formatter**: dprint — tabs, single quotes, 150 char line width.
- **Linter**: Biome — recommended ruleset with project-specific overrides.
- **Commits**: Conventional Commits format, e.g. `fix(content-api): handle null in orderBy`.

## Per-Package Structure

```
packages/{name}/
├── src/           # Source code, index.ts is the main export
├── tests/         # Test files
├── dist/          # Build output (production/ + development/ + types/)
├── tsconfig.json  # Project reference wrapper
└── package.json
```

Individual packages contain their own CLAUDE.md with package-specific architecture details.
