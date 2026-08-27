# engine-actions

Event-driven webhook system. Captures entity changes, queues events, and dispatches them to external HTTP endpoints with retry logic.

## Trigger Types

- **BasicTrigger**: Direct CRUD operations (create, update on specific fields, delete)
- **WatchTrigger**: Deep change tracking through relations — fires when any watched nested field changes

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

## Plugin Integration

Implements `Plugin` interface with:
- `getExecutionContainerHook()` — attaches TriggerHandler to EventManager per request
- `getMasterContainerHook()` — adds dispatch worker, HTTP/WebSocket routes
- `getSystemMigrations()` — creates `actions_event`, `actions_variable` tables
