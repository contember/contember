# engine-system-api

System management API handling schema migrations, stage management, and content event history.

## Core Operations

- **Migrations** (`ProjectMigrator`): Validate, sequence, and execute schema/content migrations with advisory locks for concurrency. Schema migrations apply SQL to all stages; content migrations execute GraphQL mutations.
- **Schema** (`SchemaProvider`): Builds complete schema by replaying executed migrations. Cached by checksum in single-row `schema` table.
- **Stages** (`StageCreator`): Stages are deployment environments. Each stage gets a PostgreSQL schema (`stage_<slug>`).
- **Event History** (`EventResponseBuilder`): Audit trail of all create/update/delete operations with filtering by type, table, row, identity, date range. Paginated (max 10,000).

## GraphQL API

Queries: `stages`, `executedMigrations`, `events`, `schema`

Mutations: `migrate` (+ dev-only: `truncate`, `forceMigrate`, `migrationModify`, `migrationDelete`)

Migration error codes: `MUST_FOLLOW_LATEST`, `ALREADY_EXECUTED`, `INVALID_FORMAT`, `INVALID_SCHEMA`, `MIGRATION_FAILED`, `CONTENT_MIGRATION_FAILED`, `CONTENT_MIGRATION_NOT_SUCCESSFUL`

## Database Tables (system schema)

- `schema_migration` — executed migrations registry
- `schema` — current schema snapshot (single-row)
- `stage` — stages
- `event` / `event_data` — audit log with event triggers
- `stage_transaction` — maps transactions to stages

## Architecture

Uses CQRS pattern: Commands (`SaveMigrationCommand`, `CreateStageCommand`, etc.) via CommandBus for writes, DatabaseQuery subclasses for reads. `SystemContainer` wires all services via DIC.
