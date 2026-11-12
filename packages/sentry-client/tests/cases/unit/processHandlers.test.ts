import { afterEach, describe, expect, test } from 'bun:test'
import { join } from 'node:path'
import { captureConsoleErrors, SentryClient } from '../../../src/index.js'
import { FakeIngest, IngestResponse, startFakeIngest } from './fakeIngest.js'

const fixture = join(import.meta.dir, 'processHandlers.fixture.ts')

let ingest: FakeIngest | undefined

afterEach(async () => {
	await ingest?.stop()
	ingest = undefined
})

const run = async (mode: string, response: IngestResponse = {}) => {
	const fake = await startFakeIngest(() => response)
	ingest = fake
	const proc = Bun.spawn([process.execPath, '--conditions=typescript', fixture, mode], {
		env: { ...process.env, SENTRY_TEST_DSN: fake.dsn },
		stdout: 'pipe',
		stderr: 'pipe',
	})
	let receivedAt = 0
	void fake.waitFor(1).then(() => (receivedAt = Date.now()))
	const [exitCode, stdout, stderr] = await Promise.all([proc.exited, new Response(proc.stdout).text(), new Response(proc.stderr).text()])
	return { exitCode, stdout, stderr, events: fake.received.map(it => it.event), exitDelayMs: Date.now() - receivedAt }
}

describe('installProcessHandlers', () => {
	test('reports an uncaught exception as fatal, prints it and exits with 1', async () => {
		const { exitCode, stderr, events, exitDelayMs } = await run('uncaught')
		expect(exitCode).toBe(1)
		expect(stderr).toContain('uncaught in fixture')
		expect(events).toHaveLength(1)
		expect(events[0]).toMatchObject({ level: 'fatal' })
		expect(events[0].exception?.values[0]).toMatchObject({
			value: 'uncaught in fixture',
			mechanism: { type: 'onuncaughtexception', handled: false },
		})
		expect(exitDelayMs).toBeLessThan(1500)
	}, 15_000)

	test('waits at most 2 s for the event of an uncaught exception', async () => {
		const { exitCode, events, exitDelayMs } = await run('uncaught', { delayMs: 10_000 })
		expect(exitCode).toBe(1)
		expect(events).toHaveLength(1)
		expect(exitDelayMs).toBeGreaterThan(1500)
		expect(exitDelayMs).toBeLessThan(3500)
	}, 15_000)

	test('exits at once on a second uncaught exception', async () => {
		const { exitCode, stderr, exitDelayMs } = await run('uncaught-twice', { delayMs: 10_000 })
		expect(exitCode).toBe(1)
		expect(stderr).toContain('first uncaught')
		expect(stderr).toContain('second uncaught')
		expect(exitDelayMs).toBeLessThan(1500)
	}, 15_000)

	test('reports an unhandled rejection and keeps the process running', async () => {
		const { exitCode, stdout, stderr, events } = await run('unhandled')
		expect(exitCode).toBe(0)
		expect(stdout).toBe('still running\n')
		expect(stderr).toContain('The promise rejected with the reason:')
		expect(stderr).toContain('rejected in fixture')
		expect(events).toHaveLength(1)
		expect(events[0]).toMatchObject({ level: 'error', extra: { unhandledPromiseRejection: true } })
		expect(events[0].exception?.values[0]).toMatchObject({
			value: 'rejected in fixture',
			mechanism: { type: 'onunhandledrejection', handled: false },
		})
	}, 15_000)
})

describe('captureConsoleErrors', () => {
	const recordingClient = () => {
		const calls: unknown[][] = []
		const client: SentryClient = {
			captureException: (...args) => {
				calls.push(['exception', ...args])
				return 'id'
			},
			captureMessage: (...args) => {
				calls.push(['message', ...args])
				return 'id'
			},
			flush: () => Promise.resolve(true),
			close: () => Promise.resolve(true),
		}
		return { client, calls }
	}

	const withPrinted = (body: (printed: unknown[][]) => void) => {
		const original = console.error
		const printed: unknown[][] = []
		console.error = (...args: unknown[]) => printed.push(args)
		try {
			body(printed)
		} finally {
			console.error = original
		}
	}

	test('reports an Error argument as an exception and still prints the call', () => {
		withPrinted(printed => {
			const { client, calls } = recordingClient()
			const restore = captureConsoleErrors(client)
			const error = new Error('logged')
			console.error('failed:', error)
			restore()
			expect(calls).toEqual([['exception', error, { level: 'error', extra: { arguments: ['failed:', error] } }, {
				mechanism: { type: 'console', handled: true },
			}]])
			expect(printed).toEqual([['failed:', error]])
		})
	})

	test('reports other arguments as a formatted message', () => {
		withPrinted(() => {
			const { client, calls } = recordingClient()
			const restore = captureConsoleErrors(client)
			console.error('%s has %d items', 'list', 3, { a: 1 })
			restore()
			expect(calls).toEqual([['message', 'list has 3 items { a: 1 }', {
				level: 'error',
				extra: { arguments: ['%s has %d items', 'list', 3, { a: 1 }] },
			}]])
		})
	})

	test('only prints a console.error made while reporting', () => {
		withPrinted(printed => {
			const { client, calls } = recordingClient()
			const reporting: SentryClient = {
				...client,
				captureMessage: (...args) => {
					console.error('nested')
					return client.captureMessage(...args)
				},
			}
			const restore = captureConsoleErrors(reporting)
			console.error('outer')
			restore()
			expect(calls).toHaveLength(1)
			expect(printed).toEqual([['nested'], ['outer']])
		})
	})

	test('restore puts the previous console.error back', () => {
		withPrinted(printed => {
			const { client, calls } = recordingClient()
			const restore = captureConsoleErrors(client)
			restore()
			console.error('after restore')
			expect(calls).toEqual([])
			expect(printed).toEqual([['after restore']])
		})
	})
})
