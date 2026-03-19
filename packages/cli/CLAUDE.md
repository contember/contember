# cli

Command-line interface for Contember project management. 22 commands for deployment, migrations, data transfer, validation, and actions management.

## Commands

**Deploy**: `deploy` — deploy with migrations + admin

**Migrations** (7): `migrations:diff`, `migrations:amend`, `migrations:blank`, `migrations:describe`, `migrations:execute`, `migrations:rebase`, `migrations:status`

**Data Transfer** (3): `data:export`, `data:import`, `data:transfer`

**Project** (3): `project:validate`, `project:print-schema`, `project:generate-doc`

**Actions** (6): `actions:list-variables`, `actions:set-variables`, `actions:failed-events`, `actions:get-event`, `actions:retry-event`, `actions:stop-event`

**Other**: `workspace:update:api`, `version`

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
