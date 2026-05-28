# cli

Command-line interface for Contember project management. 22 commands for deployment, migrations, data transfer, validation, and actions management.

## Commands

**Deploy**: `deploy` — deploy with migrations + admin

**Migrations** (10): `migrations:diff`, `migrations:amend`, `migrations:blank`, `migrations:describe`, `migrations:execute`, `migrations:rebase`, `migrations:status`, `migrations:init-state`, `migrations:snapshot`, `migrations:verify-snapshot`

`migrations:snapshot` collapses all migrations into `{migrationsDir}/snapshot.json` (commit it). `migrations:execute` bootstraps an empty DB from it in one step (opt-out `--no-snapshot`); `deploy` ignores it unless `--snapshot`. The server refuses a snapshot on a non-empty project. `migrations:verify-snapshot` offline-checks that the snapshot still equals a full replay. See `MigrationSnapshotFacade` and `engine-system-api` `migrateFromSnapshot`.

**Data Transfer** (3): `data:export`, `data:import`, `data:transfer`

**Project** (3): `project:validate`, `project:print-schema`, `project:generate-doc`

**Actions** (6): `actions:list-variables`, `actions:set-variables`, `actions:failed-events`, `actions:get-event`, `actions:retry-event`, `actions:stop-event`

**Tenant**: `tenant:apply [config] [--dsn] [--dry-run]` — apply declarative tenant configuration

**Other**: `workspace:update:api`, `version`

## Tenant configuration

`tenant:apply` reads a typed `tenant.config.ts` (path overridable via the first arg, default `tenant.config.ts`) and applies it idempotently to the tenant API:
- `config` → `configure` mutation (partial merge of password/login/passwordless/captcha/rateLimits)
- `identityProviders` (keyed by slug) → `addIDP`/`updateIDP` chosen from current state, then `enableIDP`/`disableIDP` to match `disabled`
- `mailTemplates` → `addMailTemplate` (server-side upsert)

Nothing is ever removed (no pruning). Authored with `defineTenantConfig` from the library export of `@contember/cli` (`src/index.ts`). Secrets come from `process.env` in the config file. Requires a token with **PROJECT_ADMIN/SUPER_ADMIN** privileges — a deploy-only (ENTRYPOINT_DEPLOYER) token is rejected by the API. Orchestration lives in `lib/tenant/` (`TenantClient`, `TenantConfigLoader`, `TenantConfigApplier`); no new server-side API was needed.

## Connection

Connects via DSN (`contember://project:token@endpoint`) or env vars:
- `CONTEMBER_DSN` — full DSN
- `CONTEMBER_API_URL` / `CONTEMBER_INSTANCE` — endpoint
- `CONTEMBER_API_TOKEN` — auth token
- `CONTEMBER_PROJECT_NAME` — project name

## Workspace Configuration

Reads `contember.yaml`:
- `apiDir`: `./api` (schema source)
- `migrationsDir`: `{apiDir}/migrations`
- `adminDir`: `./admin`

## Architecture

- Entry: `run.ts` → creates DI container (`dic.ts`) → `CommandManager` dispatches
- Schema loaded from `{apiDir}/index.ts` via `ImportSchemaLoader` (Bun) or `TranspilingSchemaLoader` (Node)
- Migration facades coordinate diff/execute/rebase with user confirmation
- All commands extend `Command<Args, Options>` from `@contember/cli-common`
