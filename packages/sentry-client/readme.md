# @contember/sentry-client

A small Sentry client for Node and Bun servers, with no runtime dependencies. It reports exceptions with their cause
chain, stack frames and source context, honours Sentry's rate limits, and can report uncaught exceptions and unhandled
rejections. It has no breadcrumbs and no automatic instrumentation: only what is passed to `captureException` (or,
when enabled, logged with `console.error`) is sent.

```ts
import { captureConsoleErrors, createSentryClient, installProcessHandlers } from '@contember/sentry-client'

const client = createSentryClient({
	dsn: 'https://<public key>@<host>/<project id>',
	release: '1.2.3',
	// change the event, or return null to drop it
	beforeSend: event => ({ ...event, request: undefined }),
})

// uncaught exceptions are reported and end the process; unhandled rejections are reported and printed
installProcessHandlers(client)
// optional: every console.error call is reported too
captureConsoleErrors(client)

client.captureException(error, { level: 'error', tags: { module: 'tenant' }, extra: { requestId } })
await client.flush(2000)
```

Event fields, the stack-frame format and the exception chain follow `@sentry/node` 7, so that issues reported by it
group with the new events.
