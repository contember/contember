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
3. While execution runs, the account reserves twice the non-string DB structures, the hydration overhead, and one serialized copy of the string contents. GraphQL shares scalar strings with DB results, so their retained contents are not charged again as new completion allocations. A further 256 bytes per DB row allows for transient completion objects.
4. The completion reserve is at least one additional decoded row on Node, or three on Bun. JSC includes external PostgreSQL buffers in its heap account; geometrically growing a partial-row buffer can temporarily retain the old buffer, its replacement, and the decoded value. Decoding is modeled as a separate phase, rather than adding its headroom to the serialization peak. This remains an estimate, not a bound on native buffers or RSS.
5. The completed response is not traversed. Its scalars and JSON values are the objects already charged as DB rows, and its structures are charged by the hydrator, so a second traversal measured the same data again for 8–10% of request CPU. After execution the handler only re-checks the budget, because GraphQL turns a failure inside a nullable resolver into partial data.

ASCII strings use one byte per code unit. Any non-ASCII string is charged two bytes per code unit. This is exact for text containing a character above U+00FF and for Bun, and conservative for Latin-1-only text on Node. All strings include an object allowance. Serialization is counted separately as one copy of all string and property-name code units; one non-ASCII string promotes the whole serialized output to two-byte storage. JSON escaping is not modeled, so text dominated by control characters, quotes, or backslashes is underestimated during serialization. Property names add to the serialized size only, because runtimes share them between objects of one shape. Objects, slots, arrays, dates, and binary views use fixed overhead estimates. Nested values use a depth-first traversal with indexed array access. After 64 nested structures, traversal switches to heap-backed iterators to bound the JavaScript call stack. Auxiliary storage grows with depth, not width; the traversal does not copy or serialize the value to measure it.

String width comes from one native `Buffer.byteLength` comparison per string, with no JavaScript character loop and no sampling. Earlier versions scanned or sampled characters to model JSON escaping and Latin-1 storage; that cost more request CPU than the rest of the accounting, for a precision far below the model's own error against the measured heap (see the results below). String accounting retains numeric counters only, never the strings or rows themselves. It avoids regex matching, which can retain a request string through the legacy `RegExp.input` global.

The first version conservatively keeps raw-row charges until request completion. `estimatedRetainedBytes` is therefore an accounting estimate, not an exact measurement of live objects. `estimatedPeakBytes` includes the completion reservation and is the threshold used for enforcement.

Once a budget is exceeded, its shared abort signal closes every currently executing DB connection associated with that budget. New work checks the same failed budget. The pool discards closed connections and can serve subsequent requests with other connections.

Exceeding the budget inside an uncommitted transaction rolls back its writes. Budget errors are not retried by the serialization-failure retry loop. Transactions that committed earlier in the request remain committed, including if the budget is exceeded during final response processing.

## Scope of protection

- A row has already been decoded when its event is emitted. One huge text or JSON value can exceed the threshold before it is checked. This is especially relevant to JSON parsing, which can expand the raw value substantially.
- GraphQL completion is covered by a reservation projected from DB rows and hydration, not by measuring the response or by an allocator hook. Values a resolver creates outside those two paths, JSON mutated after its row was read, and transient allocations can exceed the estimate.
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

The same bundle runs on Bun with `bun --expose-gc` in place of `node --expose-gc`. The optional fourth argument selects `sampled` (default) or `retained` measurement, for example `bun --expose-gc /tmp/benchmark-request-memory.mjs long-text observe retained`.

Scenarios: `small-rows`, `long-text`, `latin1`, `mixed-text`, `escaped-text`, `unicode`, `json`, `nested`, `aliases`, `single-value`. `mixed-text` adds one wide character to an otherwise ASCII response. `escaped-text` includes a control character, newline, quote, and backslash in each repeated text fragment. `typical-detail` (1 row), `typical-list` (50 rows), `typical-json` (50 rows with JSON), and `typical-nested` (10 parents × 40 children) repeat an ordinary-sized request 1,000–5,000 times in one process after a warm-up, with a fresh budget per request; they report CPU only and accept `off` or `observe`. Holdout scenarios use different sizes: `medium-rows` (20,000 × 256 characters), `few-large-rows` (128 × 65,536 characters), and `small-json` (1,000 rows with JSON and 256-character bodies).

Benchmark presets: `off`, `observe`, `enforce`. These are harness labels, not engine configuration modes. Observe uses a 1 GiB maximum; enforce uses 8 MiB to exercise cancellation. Both use a 4 MiB warning threshold. Every process runs one scenario. Repeat each preset in fresh processes and compare medians.

The heap baseline is taken after fixture creation, one small warm-up GraphQL query, and explicit GC (`globalThis.gc()` on Node, `bun:jsc.gcAndSweep()` on Bun). The budget includes the warm-up query's single row. Node reads `process.memoryUsage().heapUsed`; Bun reads `bun:jsc.heapSize()`, because Bun 1.3.14's Node-compatible `heapUsed` can remain stale even after a full GC.

- `sampled`: samples on a timer, at DB completion, after GraphQL execution, and after serialization. This is a lower bound on the true peak: synchronous work can allocate and collect between samples. JSC's string-storage accounting can also lag until GC, even with the native heap reader.
- `retained`: forces a synchronous full GC at each phase boundary, with no sampling timer. This measures live heap at those boundaries, including live string storage on Bun. It deliberately excludes collectible temporaries and perturbs GC scheduling; its timings are not throughput measurements and its peak is not equivalent to the normal sampled peak.

Both modes report `heapRetainedWithResponse` after a final full GC and include that observation in the maximum, so the reported peak cannot be below the final live heap. The response tree and serialized JSON are both used afterward to keep both reachable. Bun additionally reports `serializedHeapBytes` from `estimateShallowMemoryUsageOf`, exposing the actual serialized string's storage width. This final GC is outside the measured duration. RSS is reported separately and includes native buffers, allocator pages, and runtime code; it is not the heap calibration target. JSC's heap includes external buffers that V8 reports outside `heapUsed`, so even the corrected runtime metrics do not have identical boundaries.

This benchmark does not include HTTP compression or socket transmission. RSS is reported separately from heap. It is not attributed to a request in a concurrent engine.

## Original two-byte estimate results (2026-09-15)

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

## First sampled estimate results (superseded, 2026-09-15)

Node 24.4.0 and Bun 1.3.14, the same local PostgreSQL database and fixtures. Three fresh processes per scenario and runtime, sequentially under `cpu-lease run -n 2 --no-smt`. Times below compare the original two-byte estimator with the sampled estimator, both with accounting enabled; they are not comparisons against disabled accounting. Values are medians.

| Scenario | Original estimate MiB | Sampled estimate MiB | Node sampled heap MiB | Node original → sampled time |
|---|---:|---:|---:|---:|
| Small rows | 112.2 | 109.5 | 100.0 | 553 → 660 ms |
| Long ASCII text | 379.1 | 191.7 | 143.0 | 597 → 583 ms |
| Latin-1 | 379.1 | 379.4 | 132.0 | 1,460 → 1,368 ms |
| Mixed ASCII/Unicode | 379.1 | 254.4 | 205.9 | 710 → 717 ms |
| Escaped text | 379.1 | 316.7 | 268.0 | 1,107 → 1,681 ms |
| Unicode | 379.1 | 379.4 | 270.5 | 1,967 → 2,027 ms |
| JSON | 237.3 | 155.3 | 128.0 | 683 → 848 ms |
| Relations | 171.2 | 107.8 | 65.9 | 579 → 614 ms |
| Aliases | 118.8 | 75.4 | 49.6 | 422 → 528 ms |
| Single value | 96.0 | 80.0 | 32.2 | 239 → 228 ms |

Sampling removes most of the long-text cost of scanning every character in JavaScript. It does not remove object traversal, exact scanning of short strings, or exact fallback for heavily escaped text. The latter remains substantially slower than the original estimator. Latin-1 and Unicode estimates remain conservative for both runtimes; the largest-row allowance deliberately limits the reduction for a single large value.

| Scenario | Bun reported heap MiB | Bun original → sampled time |
|---|---:|---:|
| Small rows | 29.7 | 778 → 712 ms |
| Long ASCII text | 64.7 | 547 → 589 ms |
| Latin-1 | 127.3 | 1,279 → 1,312 ms |
| Mixed ASCII/Unicode | 64.1 | 707 → 725 ms |
| Escaped text | 64.3 | 677 → 1,105 ms |
| Unicode | 127.7 | 1,549 → 1,536 ms |
| JSON | 47.9 | 795 → 1,008 ms |
| Relations | 35.1 | 647 → 709 ms |
| Aliases | 26.0 | 527 → 558 ms |
| Single value | 27.4 | 170 → 186 ms |

Bun's reported heap has the sampling limitations described above; these numbers are not a calibration target equivalent to Node's heap. Small apparent timing improvements are noise. All 20 enforced runs (ten scenarios on each runtime, 8 MiB limit) interrupted the request and successfully executed a subsequent pool query.

## Phase-aware estimate results (2026-09-15)

Three fresh processes per scenario and runtime, sequentially under `cpu-lease run -n 2 --no-smt`. The normal sampled run includes a final live-heap observation using the corrected runtime reader. Sizes are MiB; the ratio is estimate / measured heap increase.

| Scenario | Node estimate | Node heap | Ratio |
|---|---:|---:|---:|
| Small rows | 92.3 | 96.6 | 0.96 |
| Long ASCII text | 128.6 | 142.8 | 0.90 |
| Latin-1 | 128.6 | 131.9 | 0.98 |
| Mixed ASCII/Unicode | 191.2 | 206.0 | 0.93 |
| Escaped text | 253.6 | 268.0 | 0.95 |
| Unicode | 253.7 | 270.3 | 0.94 |
| JSON | 126.3 | 129.5 | 0.98 |
| Relations | 80.0 | 66.1 | 1.21 |
| Aliases | 56.1 | 49.8 | 1.12 |
| Single value | 32.0 | 32.2 | 0.99 |
| Medium rows (holdout) | 27.6 | 29.5 | 0.94 |
| Few large rows (holdout) | 16.1 | 18.6 | 0.87 |
| Small JSON (holdout) | 12.9 | 11.2 | 1.15 |

Twelve of thirteen Node scenarios fall within 0.8–1.2; relations are just above at 1.21. The three holdout scenarios were not used to choose the model. These are local calibration results, not guaranteed bounds for arbitrary requests or GC schedules.

| Scenario | Bun estimate | Bun measured heap | Ratio |
|---|---:|---:|---:|
| Small rows | 92.3 | 30.9 | 2.99 |
| Long ASCII text | 128.6 | 126.3 | 1.02 |
| Latin-1 | 253.7 | 251.6 | 1.01 |
| Mixed ASCII/Unicode | 191.2 | 189.1 | 1.01 |
| Escaped text | 253.6 | 255.9 | 0.99 |
| Unicode | 253.7 | 251.6 | 1.01 |
| JSON | 126.3 | 77.0 | 1.64 |
| Relations | 80.0 | 51.4 | 1.56 |
| Aliases | 56.1 | 36.2 | 1.55 |
| Single value | 64.0 | 68.8 | 0.93 |
| Medium rows (holdout) | 27.6 | 14.5 | 1.90 |
| Few large rows (holdout) | 16.1 | 16.6 | 0.97 |
| Small JSON (holdout) | 12.9 | 8.4 | 1.53 |

Seven of thirteen Bun scenarios fall within the target band. String-heavy results now agree closely with the corrected measurement. Object-heavy results still overestimate the observed heap. JSC phase-boundary readings can miss collectible allocations between observations, so these results do not establish an equivalent reduction in transient-object allowances. In the single-value case, observed heap varied from 61.6 to 69.2 MiB while final live heap was 32.2 MiB: decoding buffers are material and the final live heap alone would be an unsafe peak calibration target.

All 26 enforced runs (thirteen scenarios per runtime, 8 MiB limit) interrupted the request and successfully executed a subsequent pool query. The database, Content API, and HTTP suites passed 606 tests with three existing skips.

## Enabled versus disabled accounting (2026-09-15)

Paired fresh-process runs of the phase-aware estimator: three pairs per scenario/runtime, alternating `off`/`observe` order, sequentially under `cpu-lease run -n 2 --no-smt`. Both modes use the same bundle and sampled measurement. The interval covers GraphQL execution through serialization, not CPU time or full HTTP latency. Final diagnostic GC is excluded. Each pair produces a duration difference and relative change; the table reports the median of each paired statistic.

| Scenario | Node additional time | Change | Bun additional time | Change |
|---|---:|---:|---:|---:|
| Small rows | +111 ms | +23% | +158 ms | +27% |
| Long ASCII text | +104 ms | +19% | +28 ms | +5% |
| Latin-1 | +383 ms | +27% | +380 ms | +30% |
| Mixed ASCII/Unicode | +11 ms | +1% | +31 ms | +5% |
| Escaped text | +475 ms | +48% | +183 ms | +29% |
| Unicode | +300 ms | +17% | −43 ms | −4% |
| JSON | +258 ms | +46% | +359 ms | +71% |
| Relations | +141 ms | +26% | +155 ms | +34% |
| Aliases | +139 ms | +37% | +96 ms | +26% |
| Single value | +18 ms | +8% | +4 ms | +3% |

Near-zero differences and apparent improvements are noise; three pairs are insufficient to establish small effects. JSON is expensive because accounting traverses nested values both during DB reads and during response completion, and its short strings are scanned exactly. Dense escaping and Latin-1 take exact scans rather than the ASCII/wide-text sampling fast path. The phase-aware estimate improves accuracy but accounting still has material cost, especially for object-heavy requests.

The production budget does not run GC, inspect the process heap, or retain sampled rows/strings. Those diagnostics exist only in this benchmark. The enabled cost above includes row accounting, hydration accounting, completion estimation, and their effect on runtime execution.

## Native string width versus sampled strings (2026-09-21)

Five rotating fresh-process rounds per scenario and runtime, sequentially under `cpu-lease run -n 2 --no-smt`. “Sampled” is the previous estimator (exact scan below 256 code units, 64-point escape sampling above). “Native” is the current one. Values are medians of paired process-CPU overhead against disabled accounting, with the observed range. The PostgreSQL server is a shared local container and is not CPU-pinned; process-to-process variation of ±15% is common, so small differences are not meaningful.

| Scenario | Node sampled | Node native | Bun sampled | Bun native |
|---|---:|---:|---:|---:|
| Typical detail | +5.0% (−2…+12) | −0.7% (−8…+2) | +2.2% (−9…+22) | +11.3% (−14…+27) |
| Typical list | +16.4% (−6…+36) | +1.0% (−14…+19) | +8.1% (−16…+22) | −7.3% (−15…+18) |
| Typical JSON | +27.4% (+23…+33) | +6.0% (−6…+7) | +24.8% (+19…+30) | +10.0% (−14…+15) |
| Typical nested | +17.4% (+12…+25) | +3.0% (−2…+9) | +10.8% (+7…+21) | +9.6% (−12…+17) |
| Small rows | +12.4% (+9…+23) | +22.0% (+7…+43) | +24.2% (+22…+43) | +17.0% (+13…+24) |
| JSON | +32.1% (+19…+81) | +13.7% (+3…+21) | +44.6% (+40…+53) | +16.2% (+10…+17) |
| Heterogeneous JSON | +30.0% (−1…+43) | +41.2% (−1…+47) | +77.1% (+68…+83) | +40.4% (+32…+44) |
| Latin-1 | +37.7% (+25…+48) | +2.7% (−8…+11) | +42.7% (+41…+56) | +9.3% (−0…+16) |
| Escaped text | +38.3% (+32…+52) | +1.3% (−8…+2) | +45.1% (+18…+51) | +0.0% (−13…+15) |
| Long ASCII | +20.2% (+10…+28) | +11.3% (+4…+36) | +7.7% (+6…+15) | +6.1% (+2…+9) |
| Relations | +17.8% (+6…+36) | +11.4% (+8…+33) | +30.8% (+12…+50) | +19.1% (+10…+41) |

On 100 MiB requests the remaining cost of the native estimator was structural: a profile of small rows and relations attributed 44–47 ms (8–10% of request CPU) to traversing the completed response and 10–15 ms to row accounting. A second matrix with the same method compares the native estimator with and without that traversal:

| Scenario | Node with traversal | Node without | Bun with traversal | Bun without |
|---|---:|---:|---:|---:|
| Typical detail | −0.0% (−7…+37) | +0.6% (−9…+21) | +6.1% (−3…+15) | −1.8% (−5…+2) |
| Typical list | −2.0% (−15…+1) | +0.2% (−11…+8) | +11.5% (−11…+22) | +3.3% (−4…+14) |
| Typical JSON | +4.2% (+4…+10) | +0.5% (−7…+11) | +13.1% (+6…+20) | +7.2% (+4…+18) |
| Typical nested | +0.7% (−8…+2) | −3.2% (−9…+5) | +5.2% (−2…+16) | +2.0% (−6…+7) |
| Small rows | +18.9% (+12…+39) | +9.8% (+4…+20) | +18.1% (+13…+53) | +10.0% (+4…+20) |
| JSON | +16.6% (+11…+22) | +7.0% (+4…+11) | +12.6% (+6…+24) | +9.5% (+3…+18) |
| Heterogeneous JSON | +32.1% (+23…+47) | +15.1% (+7…+26) | +33.3% (+5…+64) | +21.7% (−8…+26) |
| Latin-1 | +1.5% (−7…+6) | −1.3% (−5…−1) | +4.9% (−9…+11) | +5.2% (−11…+8) |
| Escaped text | +2.2% (−6…+7) | −0.2% (−12…+4) | +3.5% (+0…+7) | −2.5% (−7…+2) |
| Long ASCII | +10.5% (−6…+11) | +4.3% (−2…+5) | +2.0% (−1…+12) | +0.1% (−3…+7) |
| Relations | +19.5% (+17…+31) | +8.2% (+1…+16) | +11.7% (+3…+24) | +7.8% (+1…+11) |

The estimate was byte-identical with and without the traversal in every scenario: the response never exceeded the projection from DB rows and hydration. Ordinary-sized requests are within noise of disabled accounting, except JSON on Bun at about +7%. A CPU profile of the 1-row request attributes about 2% of its CPU to accounting, half of it to the abort signal and its listeners. Heterogeneous JSON remains the most expensive shape because every element of its 1,500-number arrays is visited once in JavaScript against a native `JSON.parse`.

Estimate / sampled heap peak (first matrix) is unchanged except where the string model changed on purpose:

| Scenario | Node sampled | Node native | Bun sampled | Bun native |
|---|---:|---:|---:|---:|
| Small rows | 1.00 | 1.00 | 2.99 | 2.96 |
| JSON | 1.15 | 1.14 | 1.64 | 1.62 |
| Heterogeneous JSON | 3.01 | 3.01 | 3.50 | 3.47 |
| Latin-1 | 0.90 | 1.77 | 1.01 | 1.01 |
| Escaped text | 0.95 | 0.48 | 0.99 | 0.50 |
| Long ASCII | 0.97 | 0.95 | 1.02 | 1.02 |
| Relations | 1.25 | 1.24 | 1.57 | 1.56 |

Latin-1-only text on Node is now overestimated by design. The escaped-text fixture consists solely of characters that JSON escapes (3× expansion); it bounds the underestimate from not modeling escaping. Ordinary prose escapes a few percent of its characters.

```bash
node scripts/dev/request-memory/run-paired.mjs results.jsonl 5 node,bun typical-list,json \
  off=/tmp/bench.mjs:off native=/tmp/bench.mjs:observe
node scripts/dev/request-memory/summarize-paired.mjs results.jsonl off
```

## Verification

The live-DB regression tests use temporary or uniquely named tables and clean up their sessions and connections:

```bash
export MEMORY_TEST_DATABASE_URL="$MEMORY_BENCH_DATABASE_URL"
bun test --conditions=typescript \
  packages/database/tests/cases/unit/requestMemoryBudget.test.ts \
  packages/database/tests/cases/integration/requestMemoryBudget.test.ts \
  packages/engine-http/tests/cases/integration/requestMemoryBudget.test.ts
```

They verify early interruption, pool recovery, cancellation of a sibling waiting for its first row, and compatibility with PostgreSQL query timeouts. They also verify transaction/savepoint rollback, test-session invalidation after connection closure, and request ownership when a connection is reused. The sizing tests cover ASCII versus non-ASCII text, serialization promotion, surrogate pairs, large-row headroom, and avoiding retention through `RegExp.input`. Without the environment variable, the live-DB tests are skipped.
