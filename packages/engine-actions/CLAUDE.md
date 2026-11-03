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

### Log

The log says *which event, which target, why*. Every way a delivery can fail
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
interpolated variables, which is where tokens live. The request body, a 2xx response payload and the
parser message (which quotes the payload) stay out too; they are already kept per event in
`actions_event.log`. The one exception is the body of a non-2xx response, the only place a target says
why it failed: the error-status line carries it as `response`, run through `redactRequestError` (an
error page may echo the request) and cut to 500 characters. The unit tests assert the log attributes
with an exact match precisely so a later edit cannot quietly add anything else.

The `response` stored in `actions_event.log` is capped at 4096 characters, so a large error page does
not grow the row by its full size on every retry. Both cuts are marked with the original length.

## Plugin Integration

Implements `Plugin` interface with:
- `getExecutionContainerHook()` — attaches TriggerHandler to EventManager per request
- `getMasterContainerHook()` — adds dispatch worker, HTTP/WebSocket routes
- `getSystemMigrations()` — creates `actions_event`, `actions_variable` tables
