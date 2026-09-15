# Content request memory budget

The opt-in budget estimates the data owned by one Content GraphQL request, whether it is a query or a mutation. It does not use the difference between process heap samples to attribute memory to a request.

## Configuration

Set the following in the engine configuration file:

```yaml
server:
  http:
    requestMemoryBudget:
      warnBytes: 134217728
      maxBytes: 536870912
```

- Without this configuration, accounting is disabled.
- Above `warnBytes`, the request completes normally and emits one warning when its HTTP response finishes or closes. Below this threshold it emits no memory log.
- Above `maxBytes`, the request is aborted. It also emits the warning with `maxBytesExceeded: true`.
- Both thresholds are positive integer byte counts, with `warnBytes <= maxBytes`. Both apply to the estimate including its completion reservation.
- The same budget applies to Content API **queries and mutations**, including reads during validation, relation processing, and result hydration. All nested DB scopes and transactions share the request's account.
- An exhausted budget produces HTTP 503 with GraphQL error code `RESOURCE_EXHAUSTED` and no partial data. The existing force-HTTP-OK option can still change the HTTP status.

Above the warning threshold, the request logger emits `Content request memory usage` at warning level when the HTTP response finishes or closes. Its fields include `operation`, `queryHash`, `databaseRows`, `databaseBytes`, `hydrationBytes`, `estimatedRetainedBytes`, `reservedCompletionBytes`, `estimatedPeakBytes`, `warningThresholdExceeded`, and `maxBytesExceeded`. The hash identifies the query text without logging its contents or variables.

## Accounting model

`packages/database/src/client/RequestMemoryBudget.ts` owns the shared account. A request-local DB client carries it through the existing event-manager hierarchy. It is never installed on the shared pool.

1. The `pg` row event accounts for each parsed row before the driver appends it to its result array. Normal `pg` accumulation, type parsers, and query timeouts remain in use.
2. The content hydrator accounts for new object structures, property slots, and date strings. Attaching a relation does not count the entire related subtree again.
3. While execution runs, the account reserves twice the estimated DB data plus the hydration overhead for completion. A further 256 bytes per DB row allows for transient completion objects; the many-small-rows benchmark exposed this cost.
4. Before JSON serialization, it estimates the completed `data` tree. The completion reserve is the greater of the earlier reservation and twice that tree estimate.

Strings use two bytes per UTF-16 code unit plus an object allowance. Objects, slots, arrays, dates, and binary views use fixed overhead estimates. JSON property names are counted too. Nested values are traversed iteratively; the traversal does not copy the entire value or serialize it to measure it.

The first version conservatively keeps raw-row charges until request completion. `estimatedRetainedBytes` is therefore an accounting estimate, not an exact measurement of live objects. `estimatedPeakBytes` includes the completion reservation and is the threshold used for enforcement.

Once a budget is exceeded, its shared abort signal closes every currently executing DB connection associated with that budget. New work checks the same failed budget. The pool discards closed connections and can serve subsequent requests with other connections.

Exceeding the budget inside an uncommitted transaction rolls back its writes. Budget errors are not retried by the serialization-failure retry loop. Transactions that committed earlier in the request remain committed, including if the budget is exceeded during final response processing.

## Scope of protection

- A row has already been decoded when its event is emitted. One huge text or JSON value can exceed the threshold before it is checked. This is especially relevant to JSON parsing, which can expand the raw value substantially.
- GraphQL completion is covered by an estimated reservation, not by an allocator hook. Unexpected expansion or transient allocations can exceed the estimate.
- JSON escaping, runtime object layouts, GC timing, transport buffers, and allocator retention make this a heuristic rather than a hard heap or RSS limit.
- This change does not add global admission control. Several individually acceptable requests can still exhaust a process or container together.

Choose a lower warning threshold and a higher interruption threshold, calibrated against the deployed runtime and workload. A hard OOM isolation guarantee requires an additional isolation mechanism.

## Reproduce the measurements

The benchmark uses the real PostgreSQL client, engine schema builder, mapper, hydrator, GraphQL executor, and final JSON serialization. It creates a unique SQL schema and drops it in `finally`. Use a disposable local database; an externally killed process can leave its benchmark schema behind.

From the repository root:

```bash
NODE_ENV=production cpu-lease run -n 2 -- bun build \
  --target=node --conditions=typescript \
  scripts/dev/benchmark-request-memory.ts \
  --outfile=/tmp/opencode/contember-request-memory.mjs

export MEMORY_BENCH_DATABASE_URL='postgres://USER:PASSWORD@127.0.0.1:PORT/DATABASE'

cpu-lease run -n 2 --no-smt -- node --expose-gc \
  /tmp/opencode/contember-request-memory.mjs small-rows observe
```

Scenarios: `small-rows`, `long-text`, `unicode`, `json`, `nested`, `aliases`, `single-value`.

Benchmark presets: `off`, `observe`, `enforce`. These are harness labels, not engine configuration modes. Observe uses a 1 GiB maximum; enforce uses 8 MiB to exercise cancellation. Both use a 4 MiB warning threshold. Every process runs one scenario. Repeat each preset in fresh processes and compare medians.

The heap baseline is taken after fixture creation, one small warm-up GraphQL query, and explicit GC. The budget includes the warm-up query's single row. Samples are collected on a timer, at DB completion, after GraphQL execution, after completion accounting, and after serialization. The sampled peak is a lower bound on the true peak: synchronous work can allocate and collect between samples. `heapRetainedWithResponse` is sampled after another GC with the response and serialized JSON in scope. Timings exclude this final explicit GC.

This benchmark does not include HTTP compression or socket transmission. RSS is reported separately from heap. It is not attributed to a request in a concurrent engine.

## Local results (2026-09-15)

Node 24.4.0, PostgreSQL 16.9, Linux. Three fresh processes for each scenario and mode, sequentially under `cpu-lease run -n 2 --no-smt`, without concurrent builds. Values below are medians. The short idle timeout in the benchmark reduces waiting for the pool's shutdown timers; that wait is outside the measured interval.

All sizes are MiB. “Estimate” includes the completion reservation; “heap peak” is the sampled heap increase with accounting enabled, before the final explicit GC.

| Scenario | Fixture | Response | Estimate | Heap peak | Time off → observe |
|---|---|---:|---:|---:|---:|
| Small rows | 100,000 rows, 16-character body | 8.5 | 112.2 | 95.0 | 403 → 466 ms |
| Long text | 4,000 rows, 16,384-character ASCII body | 62.8 | 379.1 | 144.7 | 547 → 559 ms |
| Unicode | 4,000 rows, 8,192 repetitions of `ž漢` | 156.5 | 379.1 | 270.2 | 1,545 → 1,535 ms |
| JSON | 10,000 rows, 20 nested objects per JSON value | 30.8 | 237.3 | 127.8 | 432 → 566 ms |
| Relations | 1,000 parents, 40 children each | 22.2 | 171.2 | 65.4 | 403 → 444 ms |
| Aliases | Three root selections of 10,000 rows | 16.7 | 118.8 | 49.8 | 335 → 407 ms |
| Single value | One 16 MiB ASCII body | 16.0 | 96.0 | 32.2 | 202 → 194 ms |

The small-row sampled peak ranged from 82.6 to 100.1 MiB; the alias peak ranged from 48.9 to 67.8 MiB. GC makes a single sample unsuitable as an exact calibration target. Small apparent timing improvements are noise, not an optimization claim.

Accounting overhead was approximately 16% for small rows, 2% for long text, 31% for JSON, 10% for relations, and 22% for aliases. Traversing JSON and the completed response costs CPU; the feature is therefore opt-in, not an unconditional default. The conservative two-byte string estimate intentionally overestimates ASCII-heavy requests.

With an 8 MiB enforced budget:

| Scenario | Rows accounted at interruption, including warm-up | Sampled heap increase |
|---|---:|---:|
| Small rows | 8,389 | 3.1 MiB |
| Long text | 86 | 2.0 MiB |
| Unicode | 86 | 3.6 MiB |
| JSON | 341 | 3.2 MiB |
| Relations | 2,042 | 3.7 MiB |
| Aliases | 2,111 | 3.3 MiB |
| Single value | 2 | 16.5 MiB |

All enforced runs rejected the query and successfully executed a subsequent query through the pool. The single-value result demonstrates why this is not a hard allocation limit: the row event arrives after decoding the 16 MiB string.

## Verification

The live-DB regression tests create uniquely named tables for transaction checks and drop them in `finally`:

```bash
export MEMORY_TEST_DATABASE_URL="$MEMORY_BENCH_DATABASE_URL"
bun test --conditions=typescript packages/database/tests/cases/integration/requestMemoryBudget.test.ts
```

They verify early interruption, pool recovery, cancellation of a sibling waiting for its first row, and compatibility with PostgreSQL query timeouts. They also verify that an oversized read rolls back a preceding write, both with and without a nested savepoint, does not trigger retries, and that a subsequent write below the maximum commits. Without the environment variable, these tests are skipped.
