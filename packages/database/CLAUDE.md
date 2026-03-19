# database

PostgreSQL abstraction layer wrapping `pg` with fluent immutable query builders, connection pooling, transactions, and typed error translation.

## Query Builders

All builders are **immutable** — each method returns a new instance.

- **SelectBuilder**: `.from()`, `.select()`, `.where()`, `.join()` / `.leftJoin()`, `.groupBy()`, `.orderBy()`, `.limit()`, `.distinct()`, `.with()` / `.withRecursive()`, `.lock()`, `.getResult(db)`
- **InsertBuilder**: `.into()`, `.values()`, `.onConflict()` (upsert), `.returning()`, `.from()` (INSERT FROM SELECT), `.execute(db)`
- **UpdateBuilder**: `.table()`, `.values()`, `.where()`, `.from()`, `.returning()`, `.execute(db)`
- **DeleteBuilder**: `.from()`, `.where()`, `.using()`, `.returning()`, `.execute(db)`
- **ConditionBuilder**: `.compare()`, `.compareColumns()`, `.in()`, `.exists()`, `.isNull()`, `.raw()`, `.and()`, `.or()`, `.not()`

## SQL Compilation

Builders compile to `Literal` objects (SQL string + parameters array). The `Compiler` handles schema context, CTE alias tracking, and `__SCHEMA__` placeholder replacement.

## Connection Management

- `Connection.create(config)` — pool-based (default 10 connections)
- `Connection.createSingle(config)` — single connection
- `connection.createClient(schema, queryMeta)` — creates `Client` with schema context
- `client.transaction(callback)` — REPEATABLE_READ isolation, nested via SAVEPOINTs
- `client.locked(lockNumber, callback)` — PostgreSQL advisory locks

## Pool Configuration

`maxConnections`, `maxIdle`, `idleTimeoutMs`, `acquireTimeoutMs`, `reconnectIntervalMs`, `rateLimitCount/PeriodMs`, `maxUses`, `maxAgeMs`

## Error Translation

PostgreSQL error codes are mapped to typed errors: `NotNullViolationError`, `ForeignKeyViolationError`, `UniqueViolationError`, `SerializationFailureError`, `InvalidDataError`, `TransactionAbortedError`

## Key Files

- `client/Connection.ts` — pool manager, connection factory
- `client/Client.ts` — high-level DB interface with builder factories
- `client/Pool.ts` — connection pool with rate limiting and lifecycle management
- `client/Transaction.ts` — transaction + savepoint handling
- `client/AcquiredConnection.ts` — mutex-serialized query execution with timing
- `builders/` — SelectBuilder, InsertBuilder, UpdateBuilder, DeleteBuilder, ConditionBuilder, Compiler
- `Literal.ts` — SQL + parameters encapsulation
