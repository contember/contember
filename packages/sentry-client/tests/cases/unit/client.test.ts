import { afterEach, describe, expect, test } from 'bun:test'
import { hasSubscribers } from 'node:diagnostics_channel'
import http from 'node:http'
import https from 'node:https'
import { hostname } from 'node:os'
import { createSentryClient, SentryClientOptions } from '../../../src/index.js'
import { FakeIngest, startFakeIngest } from './fakeIngest.js'

let ingest: FakeIngest | undefined

afterEach(async () => {
	await ingest?.stop()
	ingest = undefined
})

const setup = async (options: Partial<SentryClientOptions> = {}, respond?: Parameters<typeof startFakeIngest>[0]) => {
	const fake = await startFakeIngest(respond)
	ingest = fake
	const logs: string[] = []
	// Bun's own fetch: the test preload replaces the global one with happy-dom's, which sends CORS preflights
	const client = createSentryClient({ dsn: fake.dsn, logger: message => logs.push(message), fetch: Bun.fetch, ...options })
	return { client, ingest: fake, logs }
}

describe('sentry client', () => {
	test('delivers an exception event in an envelope', async () => {
		const { client, ingest } = await setup({ release: '1.2.3', environment: 'staging', version: '1.2.3' })
		const error = new Error('it failed')
		const eventId = client.captureException(error)
		expect(await client.flush(2000)).toBe(true)

		const [received] = ingest.received
		expect(received.method).toBe('POST')
		expect(received.url).toBe('/api/42/envelope/')
		expect(received.headers['content-type']).toBe('application/x-sentry-envelope')
		expect(received.headers['x-sentry-auth']).toBe('Sentry sentry_version=7, sentry_key=public, sentry_client=contember.sentry-client/1.2.3')
		expect(received.header).toEqual({
			event_id: eventId ?? '',
			sent_at: expect.any(String),
			sdk: { name: 'contember.sentry-client', version: '1.2.3' },
		})
		expect(received.itemHeader).toEqual({ type: 'event' })

		const { event } = received
		expect(event).toMatchObject({
			event_id: eventId ?? '',
			platform: 'node',
			level: 'error',
			release: '1.2.3',
			environment: 'staging',
			server_name: hostname(),
			sdk: { name: 'contember.sentry-client', version: '1.2.3' },
			contexts: { runtime: { name: 'node', version: process.version }, os: { name: expect.any(String) } },
		})
		expect(event.event_id).toMatch(/^[0-9a-f]{32}$/)
		expect(Math.abs(event.timestamp - Date.now() / 1000)).toBeLessThan(10)
		const value = event.exception?.values[0]
		expect(value).toMatchObject({ type: 'Error', value: 'it failed', mechanism: { type: 'generic', handled: true } })
	})

	test('adds source lines around the frames', async () => {
		const { client, ingest } = await setup()
		const error = new Error('with context') // the marker line
		client.captureException(error)
		await client.flush(2000)
		const frame = ingest.received[0].event.exception?.values[0].stacktrace?.frames.at(-1)
		expect(frame?.filename).toBe(import.meta.path)
		expect(frame?.in_app).toBe(true)
		expect(frame?.context_line).toContain('// the marker line')
		expect(frame?.pre_context).toHaveLength(7)
		expect(frame?.post_context).toHaveLength(7)
	})

	test('leaves out source lines when contextLines is 0', async () => {
		const { client, ingest } = await setup({ contextLines: 0 })
		client.captureException(new Error('without context'))
		await client.flush(2000)
		expect(ingest.received[0].event.exception?.values[0].stacktrace?.frames.at(-1)?.context_line).toBeUndefined()
	})

	test('defaults the environment to production', async () => {
		const { client, ingest } = await setup()
		client.captureException(new Error('x'))
		await client.flush(2000)
		expect(ingest.received[0].event).toMatchObject({ environment: 'production', sdk: { version: 'unknown' } })
		expect(ingest.received[0].event.release).toBeUndefined()
	})

	test('adds the scope', async () => {
		const { client, ingest } = await setup()
		client.captureException(new Error('x'), {
			level: 'fatal',
			tags: { module: 'content', project: undefined },
			user: { id: 'u1' },
			extra: { requestId: 'r1', deep: { a: { b: { c: 1 } } } },
			request: { url: `https://example.com/${'p'.repeat(300)}`, data: { a: { b: { c: { d: { e: 1 } } } } } },
			contexts: { trace: { trace_id: 't1', span_id: 's1' } },
		})
		await client.flush(2000)
		const { event } = ingest.received[0]
		expect(event.level).toBe('fatal')
		expect(event.tags).toEqual({ module: 'content' })
		expect(event.user).toEqual({ id: 'u1' })
		expect(event.extra).toEqual({ requestId: 'r1', deep: { a: { b: '[Object]' } } })
		expect(event.request?.url).toBe(`https://example.com/${'p'.repeat(230)}...`)
		expect(event.request?.data).toEqual({ a: { b: { c: { d: { e: 1 } } } } })
		expect(event.contexts?.trace).toEqual({ trace_id: 't1', span_id: 's1' })
		expect(event.contexts?.runtime).toBeDefined()
	})

	test('reports a non-Error value with its serialized form in extra', async () => {
		const { client, ingest } = await setup()
		client.captureException({ beta: 1, alpha: { nested: { deeper: 1 } } }, { extra: { requestId: 'r1' } })
		await client.flush(2000)
		const { event } = ingest.received[0]
		expect(event.exception?.values[0]).toMatchObject({ value: 'Object captured as exception with keys: alpha, beta', mechanism: { synthetic: true } })
		expect(event.extra).toEqual({ requestId: 'r1', __serialized__: { beta: 1, alpha: { nested: '[Object]' } } })
	})

	test('reports the same error object once', async () => {
		const { client, ingest } = await setup()
		const error = new Error('logged twice')
		expect(client.captureException(error)).toBeString()
		expect(client.captureException(error)).toBeUndefined()
		client.captureException(new Error('logged twice'))
		await client.flush(2000)
		expect(ingest.received).toHaveLength(2)
	})

	test('captureMessage', async () => {
		const { client, ingest } = await setup()
		client.captureMessage('m'.repeat(300), { extra: { n: 1 } })
		await client.flush(2000)
		const { event } = ingest.received[0]
		expect(event).toMatchObject({ level: 'info', message: `${'m'.repeat(250)}...`, extra: { n: 1 } })
		expect(event.exception).toBeUndefined()
	})

	describe('beforeSend', () => {
		test('can change the event', async () => {
			const { client, ingest } = await setup({ beforeSend: event => ({ ...event, request: { ...event.request, data: '[redacted]' } }) })
			client.captureException(new Error('x'), { request: { url: 'https://example.com', data: { password: 'secret' } } })
			await client.flush(2000)
			expect(ingest.received[0].event.request).toEqual({ url: 'https://example.com', data: '[redacted]' })
		})

		test('can drop the event, also asynchronously', async () => {
			const { client, ingest } = await setup({ beforeSend: async event => event.message === 'keep' ? event : null })
			client.captureMessage('drop')
			client.captureException(new Error('drop'))
			client.captureMessage('keep')
			await client.flush(2000)
			expect(ingest.received.map(it => it.event.message)).toEqual(['keep'])
		})

		test('drops the event and logs when it throws', async () => {
			const { client, ingest, logs } = await setup({
				beforeSend: () => {
					throw new Error('hook broke')
				},
			})
			client.captureException(new Error('x'))
			expect(await client.flush(2000)).toBe(true)
			expect(ingest.received).toHaveLength(0)
			expect(logs).toEqual(['Sentry: beforeSend failed, the event was dropped: hook broke'])
		})
	})

	test('flush reports a delivery that did not finish in time', async () => {
		const { client, ingest } = await setup({}, () => ({ delayMs: 300 }))
		client.captureException(new Error('slow'))
		expect(await client.flush(50)).toBe(false)
		expect(await client.flush(2000)).toBe(true)
		expect(ingest.received).toHaveLength(1)
	})

	test('ignores captures after close', async () => {
		const { client, ingest } = await setup()
		client.captureException(new Error('before'))
		expect(await client.close(2000)).toBe(true)
		expect(client.captureException(new Error('after'))).toBeUndefined()
		expect(client.captureMessage('after')).toBeUndefined()
		await client.flush(2000)
		expect(ingest.received).toHaveLength(1)
	})

	test('logs a delivery failure', async () => {
		const { client, logs } = await setup({}, () => ({ status: 403 }))
		client.captureException(new Error('x'))
		await client.flush(2000)
		expect(logs).toEqual(['Sentry: an event was rejected with HTTP 403'])
	})

	test('does not instrument outgoing requests, whose URLs may carry credentials', async () => {
		const before = { fetch: globalThis.fetch, httpRequest: http.request, httpsRequest: https.request }
		const { client } = await setup()
		client.captureException(new Error('x'))
		await client.flush(2000)
		expect({ fetch: globalThis.fetch, httpRequest: http.request, httpsRequest: https.request }).toEqual(before)
		for (const channel of ['undici:request:create', 'undici:request:headers', 'http.client.request.start']) {
			expect(hasSubscribers(channel)).toBe(false)
		}
	})

	test('rejects an invalid DSN when created', () => {
		expect(() => createSentryClient({ dsn: 'https://example.com/1' })).toThrow('Invalid Sentry DSN: the public key is missing')
	})
})
