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

## Writing to a jsonb column

`JSON.stringify` the value before passing it to `InsertBuilder.values(...)`. `pg` serializes a JS **object** as JSON (correct for jsonb) but a JS **array** as a PostgreSQL array literal (`{...}`), which corrupts the column — an empty `[]` comes back as `{}`, no longer an array. Stringifying makes pg send text, which the implicit text→jsonb assignment cast parses correctly. `engine-actions`' `EventsRepository` does this for its `log` column.

This is invisible to a mapper unit test; cover a new raw jsonb write with an e2e assertion.

## Connection Management

- `Connection.create(config)` — pool-based (default 10 connections)
- `Connection.createSingle(config)` — single connection
- `connection.createClient(schema, queryMeta)` — creates `Client` with schema context
- `connection.withMaxConnections(n)` — returns a `ScopeLimitedConnection` view that caps how many pool connections may be acquired concurrently through it (one per top-level `scope`; nested scopes reuse the held connection and are not counted). Used per HTTP request so a single request cannot starve the shared pool.
- `client.transaction(callback)` — REPEATABLE_READ isolation, nested via SAVEPOINTs
- `client.locked(lockNumber, callback)` — PostgreSQL advisory locks

## Request Memory Budget

`client.withMemoryBudget(budget)` attaches a `RequestMemoryBudget` to the client's `EventManager`, because that is the only object every `scope`/`transaction`/savepoint already propagates. `AcquiredConnection.query` reads it from there and accounts rows as they arrive.

- An `EventManager` inherits its parent's budget by default. Passing `null` explicitly **detaches** it — `rollback()` does this so cleanup still runs after the budget is exhausted. Listeners keep firing through the parent chain either way.
- Exhaustion ends the physical connection of every in-flight query of that request and marks it terminated. `AcquiredConnection.query` then refuses further queries with `TerminatedConnectionError` **before** firing any event, and `executeTransaction` swallows exactly that error from its rollback (PostgreSQL already rolled back). Any other rollback failure still propagates. The enclosing `Connection.scope` disposes the connection because the scope throws; swallowing `RequestMemoryBudgetExceededError` inside a scope would release a dead connection to the pool.
- The Content API attaches the budget only to `Mapper.selectionDb` (selection fetches), never to the request client — internal mutation queries are garbage right after use and must not be charged. See `packages/engine-content-api/CLAUDE.md`.
- The live-DB tests in `tests/cases/integration/` skip without `MEMORY_TEST_DATABASE_URL`; CI runs them in the `test-db` job.

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
- `client/ScopeLimitedConnection.ts` — semaphore-limited connection view (per-request connection cap)
- `utils/Semaphore.ts` — counting semaphore with FIFO queue (backs `ScopeLimitedConnection`)
- `builders/` — SelectBuilder, InsertBuilder, UpdateBuilder, DeleteBuilder, ConditionBuilder, Compiler
- `Literal.ts` — SQL + parameters encapsulation
