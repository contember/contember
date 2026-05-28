# engine-system-api

System management API handling schema migrations, stage management, and content event history.

## Core Operations

- **Migrations** (`ProjectMigrator`): Validate, sequence, and execute schema/content migrations with advisory locks for concurrency. Schema migrations apply SQL to all stages; content migrations execute GraphQL mutations.
- **Schema** (`SchemaProvider`): Builds complete schema by replaying executed migrations. Cached by checksum in single-row `schema` table.
- **Stages** (`StageCreator`): Stages are deployment environments. Each stage gets a PostgreSQL schema (`stage_<slug>`).
- **Event History** (`EventResponseBuilder`): Audit trail of all create/update/delete operations with filtering by type, table, row, identity, date range. Paginated (max 10,000).

## GraphQL API

Queries: `stages`, `executedMigrations`, `events`, `schema`

Mutations: `migrate`, `migrateFromSnapshot` (+ dev-only: `truncate`, `forceMigrate`, `migrationModify`, `migrationDelete`)

`migrateFromSnapshot` bootstraps an **empty** project: it applies a collapsed schema (`SnapshotInput.modifications`) to every stage once and records the `covers` migrations as executed without replaying their SQL, so the registry ends up identical to a full replay. It is refused (`PROJECT_NOT_EMPTY`) if any migration has already run. Handled by `ProjectMigrator.migrateFromSnapshot`; the CLI side lives in `cli` `MigrationSnapshotFacade`.

Migration error codes: `MUST_FOLLOW_LATEST`, `ALREADY_EXECUTED`, `INVALID_FORMAT`, `INVALID_SCHEMA`, `MIGRATION_FAILED`, `CONTENT_MIGRATION_FAILED`, `CONTENT_MIGRATION_NOT_SUCCESSFUL`, `PROJECT_NOT_EMPTY`

## Migrations snapshot (engine-internal)

> Not to be confused with project **`migrateFromSnapshot`** above. This section is the engine's *own* `system`/`tenant` schema bootstrap (a `pg_dump`), unrelated to user project migrations.

`src/migrations/snapshot.ts` is a generated `pg_dump` of the full-migration schema, used to bootstrap fresh DBs. Regenerate it whenever you add/change a migration — never hand-edit:

```bash
./scripts/create-migrations-snapshot/run.sh system
```

The system snapshot templates uuid generation via `${randomUuidFn}` (built-in `gen_random_uuid` on modern PG), and the script drops the migration-provided `uuid_generate_v4` fallback function from the dump. See `engine-tenant-api/CLAUDE.md` → "Migrations & snapshot" for the full workflow and verification steps.

## Database Tables (system schema)

- `schema_migration` — executed migrations registry
- `schema` — current schema snapshot (single-row)
- `stage` — stages
- `event` / `event_data` — audit log with event triggers
- `stage_transaction` — maps transactions to stages

## Architecture

Uses CQRS pattern: Commands (`SaveMigrationCommand`, `CreateStageCommand`, etc.) via CommandBus for writes, DatabaseQuery subclasses for reads. `SystemContainer` wires all services via DIC.
