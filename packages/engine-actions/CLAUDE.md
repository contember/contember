# engine-actions

Event-driven webhook system. Captures entity changes, queues events, and dispatches them to external HTTP endpoints with retry logic.

## Trigger Types

- **BasicTrigger**: Direct CRUD operations (create, update on specific fields, delete)
- **WatchTrigger**: Deep change tracking through relations — fires when any watched nested field changes

## Target Types

- **WebhookTarget** (`webhook`): HTTP POST to an external endpoint (see below).
- **AuditLogTarget** (`auditLog`): built-in short-circuit that writes an audit row into a content entity — no webhook (see below).

## Architecture

```
Entity mutation → EventManager listeners (TriggerHandler)
  → TriggerPayloadManager accumulates events
  → TriggerPayloadPersister saves to actions_event table (before commit)
  → DispatchWorkerSupervisor runs ProjectDispatcher per project
  → EventDispatcher.processBatch() fetches queued events
  → WebhookTargetHandler sends HTTP POST to target URL
```

## Event Lifecycle

States: `created` → `processing` → `succeed` | `retrying` → `failed` | `stopped`

- 10-minute ACK timeout on processing
- Exponential backoff: 5s initial, 2x multiplier, max 10 attempts
- Pessimistic locking with `FOR NO KEY UPDATE SKIP LOCKED` for concurrent dispatch

## Webhook Target

- Configurable: URL, headers, timeout (default 30s), batch size, max attempts
- Variable interpolation in URL/headers: `{{variableName}}`
- Response: optional `{ failures: [{ eventId, error }] }`
- Payload wrapped in meta envelope (eventId, transactionId, identity, timestamps, retries)

## Variables

`{{name}}` in a target's URL or headers, resolved at dispatch time from two sources:

- rows in `actions_variable`, written by the `setVariables` mutation
- the engine environment — `<PROJECT>_ACTIONS_VARIABLE_<NAME>`, falling back to `DEFAULT_ACTIONS_VARIABLE_<NAME>`,
  with the project part built by `projectNameToEnvName` (the same convention as `%project.env.X%`)

An environment value overrides a row of the same name and is neither readable nor writable through the API:
`listVariables` reports it as `source: ENVIRONMENT` with a `null` value and `setVariables` rejects it, so its
only owner is the secret store it came from. Only `fetchVariables` (dispatch) ever sees it. The env map reaches
`VariablesManager` as the master container's `env` service; the project slug comes from `ProjectDispatcher`
(worker) or `ActionsContext` (API).

## Audit-Log Target (built-in, no webhook)

An engine-side short-circuit that persists a fired `watch` trigger straight into a
**project content entity** as an append-only audit row — replacing the webhook →
external-worker → content-mutation round-trip that projects used to hand-build.

- **Decorator sugar:** `@c.AuditLog({ watch, entity, synchronous? })` on the audited entity
  registers the watch trigger + target. `entity` is a class reference (or `() => Entity` thunk),
  not a string — resolved to the entity name in `schema-definition`'s `ActionsFactory`. The sink
  is an explicit content entity in the model; extend `c.AuditLogEntity` for the default
  fields/indexes or define a compatible entity by hand for custom ACL/indexes.
- **Explicit:** `c.createAuditLogTarget({ entity, synchronous? })` + `@c.Watch({ ..., withNodes: true, target })`.
  Target type `auditLog`; `entity` likewise a class reference/thunk. The resolved schema keeps a plain name.
- The sink entity's shape is validated against `@contember/schema-utils` `auditLogColumns`
  (single source of truth) by `ActionsValidator` — required `transactionId`/`rootEntity`/`rootId`/`data`,
  optional-but-typed `identityId`/`trigger`/`nodes`/`createdAt`.
- Writes go through `audit/AuditLogWriter.ts` — a raw `InsertBuilder` into the entity's
  table that **bypasses content ACL by construction** (like `TriggerPayloadPersister`
  writes `actions_event`), so no application role can forge rows. Actor `identityId` is
  captured natively (no `assumeIdentity` hack). Columns filled by convention:
  `createdAt`, `transactionId`, `identityId`, `rootEntity`, `rootId`, `trigger`,
  `data` (full payload), `nodes` (deduped touched-node list); missing ones are skipped.
  JSON columns are `JSON.stringify`-ed (pg serializes JS arrays as array literals, not jsonb).
- **Timing is configurable** via `synchronous`:
  - `true` → written in the audited change's own transaction (`TriggerPayloadPersister`
    short-circuits before enqueue). Atomic, no queue, no dispatch.
  - `false`/omitted → enqueued to `actions_event` and written at dispatch time by
    `AuditLogTargetHandler`, reusing the queue's retry/backoff.
- No engine migration: the audit table is part of the project content schema.

## GraphQL API (mounted at `/actions/:projectSlug`)

Mutations: `processBatch`, `retryEvent`, `stopEvent`, `setVariables` (MERGE/SET/APPEND_ONLY_MISSING)

Queries: `failedEvents`, `eventsToProcess`, `eventsInProcessing`, `event`, `variables`

Also mounted at `/panel/api/actions/:projectSlug` via the `panelApiMount` service when the management
panel is served, which is what makes the API reachable from the panel UI.

## Observability (`ActionsMetrics`)

Cheap in-memory Prometheus metrics (no table polling), registered onto the engine's shared registry
via `getMasterContainerHook`, labelled by `contember_project`:

- `contember_actions_events_enqueued_total` — inflow (from `TriggerPayloadPersister`, pre-commit)
- `contember_actions_events_succeeded_total` — terminal success
- `contember_actions_delivery_attempts_failed_total` — failed webhook attempts (incl. retries)
- `contember_actions_events_failed_total` — terminal failures (retries exhausted or unknown target)
- `contember_actions_worker_heartbeat_timestamp_seconds` — gauge set each loop iteration; staleness ⇒ stuck/dead worker
- `contember_actions_worker_crashed_total` — dispatch-loop crashes (each auto-restarted by the supervisor)

Backlog is *estimated* as a trend: `enqueued − succeeded − failed` (rate comparison; the absolute value
drifts across restarts and ignores manual retry/stop — query `actions_event` for an exact depth).

The `ProjectDispatcher` idle wait is capped at `MAX_IDLE_SLEEP_MS` (30s) even when the queue is empty,
so a lost `pg_notify` self-heals and the heartbeat keeps refreshing while idle.
On shutdown, `end()` waits at most `END_TIMEOUT_MS` (10s) for an in-flight batch; events it abandons
stay in processing and are delivered again after the ACK timeout.

### Log

Metrics say *how many*; the log says *which event, which target, why*. Every way a delivery can fail
emits a line, so a target that rejects everything is visible without querying `actions_event`. The
level splits on whether an operator has to act: `error` for a terminal state nothing will retry,
`warn` for a failed attempt that still has attempts left.

| Level | Message | Emitted from |
|---|---|---|
| `warn` | (the thrown error) — request never completed, e.g. DNS, timeout | `WebhookTargetHandler.handle` |
| `warn` | `Webhook target responded with an error status` | `WebhookTargetHandler` non-2xx branch |
| `warn` | `Webhook target reported failed events` | per-event `failures` in a 2xx response |
| `warn` | `Webhook target reported failures for event ids outside the batch` | `failures` naming unknown ids |
| `warn` | `Webhook target returned a malformed response` | body is not the documented JSON shape |
| `error` | `Action event failed permanently, no attempts left` | `EventsRepository.persistProcessed` |
| `error` | `Action event failed permanently, its target is not in the schema` | `EventsRepository.fetchBatch` |

**Never log a credential.** The target is identified by `name` only — its URL and headers carry
interpolated variables, which is where tokens live. The request body, the response payload and the
parser message (which quotes the payload) stay out too; they are already kept per event in
`actions_event.log`. The unit tests assert the log attributes with an exact match precisely so a
later edit cannot quietly add one of these back.

### Traces

When telemetry is enabled (`telemetry.traces` in server config), each processed batch runs as an
`actions.dispatch` consumer span (project, target name, batch id, event count, result counts) with a
`webhook` client span around the HTTP call — idle queue polls emit no spans. The outgoing webhook
request carries a W3C `traceparent` header pointing at the webhook span (`propagateToWebhooks`
config, default on; a target-configured header of any letter case wins). The same credential rule
applies to spans: target `name` and status code only, never the resolved URL or headers.

## Plugin Integration

Implements `Plugin` interface with:
- `getExecutionContainerHook()` — attaches TriggerHandler to EventManager per request
- `getMasterContainerHook()` — adds dispatch worker, HTTP/WebSocket routes
- `getSystemMigrations()` — creates `actions_event`, `actions_variable` tables
