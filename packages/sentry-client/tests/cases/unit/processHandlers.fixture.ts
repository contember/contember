import { createSentryClient, installProcessHandlers, SentryClient } from '../../../src/index.js'

// Run by processHandlers.test.ts: `bun processHandlers.fixture.ts <mode>` with SENTRY_TEST_DSN pointing at a fake ingest.
const dsn = process.env.SENTRY_TEST_DSN
if (!dsn) {
	throw new Error('SENTRY_TEST_DSN is not set')
}
const client = createSentryClient({ dsn, contextLines: 0 })
const mode = process.argv[2]
const failingClient: SentryClient = {
	...client,
	captureException: () => {
		throw new Error('capture broke')
	},
}
installProcessHandlers(mode === 'uncaught-capture-throws' ? failingClient : client)

if (mode === 'uncaught' || mode === 'uncaught-capture-throws') {
	setTimeout(() => {
		throw new Error('uncaught in fixture')
	}, 0)
} else if (mode === 'uncaught-twice') {
	setTimeout(() => {
		throw new Error('first uncaught')
	}, 0)
	setTimeout(() => {
		throw new Error('second uncaught')
	}, 100)
} else if (mode === 'unhandled') {
	void Promise.reject(new Error('rejected in fixture'))
	setTimeout(async () => {
		await client.flush(2000)
		process.stdout.write('still running\n')
	}, 100)
} else {
	throw new Error(`Unknown mode ${mode}`)
}
