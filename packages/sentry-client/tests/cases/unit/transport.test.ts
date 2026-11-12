import { describe, expect, test } from 'bun:test'
import { createFetchTransport, Fetch, parseRateLimits, parseRetryAfter } from '../../../src/transport.js'

interface Call {
	readonly url: string
	readonly init: RequestInit
}

const setup = (respond: (call: Call) => Promise<Response>, options: { maxInFlight?: number; timeoutMs?: number } = {}) => {
	const calls: Call[] = []
	const logs: string[] = []
	let time = 1_000_000
	const fetch: Fetch = (url, init) => {
		const call = { url, init }
		calls.push(call)
		return respond(call)
	}
	const transport = createFetchTransport({
		url: 'https://ingest.example.com/api/1/envelope/',
		auth: 'Sentry sentry_version=7, sentry_key=k, sentry_client=test/1',
		fetch,
		logger: message => logs.push(message),
		timeoutMs: options.timeoutMs ?? 5000,
		maxInFlight: options.maxInFlight ?? 30,
		now: () => time,
	})
	return { transport, calls, logs, advance: (ms: number) => (time += ms) }
}

const ok = () => Promise.resolve(new Response('{}'))

/** A fetch whose responses are held until released. */
const held = () => {
	const pending: (() => void)[] = []
	return {
		respond: () => new Promise<Response>(resolve => pending.push(() => resolve(new Response('{}')))),
		release: () => pending.splice(0).forEach(it => it()),
	}
}

describe('fetch transport', () => {
	test('posts the envelope with the auth header', async () => {
		const { transport, calls } = setup(ok)
		transport.send('envelope body', 'error')
		expect(await transport.flush(1000)).toBe(true)
		expect(calls).toHaveLength(1)
		expect(calls[0].url).toBe('https://ingest.example.com/api/1/envelope/')
		expect(calls[0].init.method).toBe('POST')
		expect(calls[0].init.body).toBe('envelope body')
		expect(calls[0].init.headers).toEqual({
			'Content-Type': 'application/x-sentry-envelope',
			'X-Sentry-Auth': 'Sentry sentry_version=7, sentry_key=k, sentry_client=test/1',
		})
		expect(calls[0].init.signal).toBeInstanceOf(AbortSignal)
	})

	test('stops sending after a 429 until Retry-After has passed', async () => {
		const { transport, calls, logs, advance } = setup(() => Promise.resolve(new Response('', { status: 429, headers: { 'Retry-After': '10' } })))
		transport.send('a', 'error')
		await transport.flush(1000)
		transport.send('b', 'error')
		advance(9_999)
		transport.send('c', 'error')
		await transport.flush(1000)
		expect(calls).toHaveLength(1)
		advance(1)
		transport.send('d', 'error')
		await transport.flush(1000)
		expect(calls.map(it => it.init.body)).toEqual(['a', 'd'])
		expect(logs).toEqual(['Sentry: rate limited, events are dropped until the limit expires'])
	})

	test('waits 60 s after a 429 without Retry-After', async () => {
		const { transport, calls, advance } = setup(() => Promise.resolve(new Response('', { status: 429 })))
		transport.send('a', 'error')
		await transport.flush(1000)
		advance(59_999)
		transport.send('b', 'error')
		advance(1)
		transport.send('c', 'error')
		await transport.flush(1000)
		expect(calls.map(it => it.init.body)).toEqual(['a', 'c'])
	})

	test('applies X-Sentry-Rate-Limits per category, also on a successful response', async () => {
		const { transport, calls, advance } = setup(() =>
			Promise.resolve(new Response('{}', { headers: { 'X-Sentry-Rate-Limits': '30:error;default:organization, 5:transaction:project' } }))
		)
		transport.send('first', 'error')
		await transport.flush(1000)
		transport.send('error blocked', 'error')
		transport.send('transaction blocked', 'transaction')
		transport.send('session sent', 'session')
		advance(5_000)
		transport.send('transaction sent', 'transaction')
		transport.send('error still blocked', 'error')
		advance(25_000)
		transport.send('error sent', 'error')
		await transport.flush(1000)
		expect(calls.map(it => it.init.body)).toEqual(['first', 'session sent', 'transaction sent', 'error sent'])
	})

	test('an empty category list in X-Sentry-Rate-Limits blocks everything', async () => {
		const { transport, calls } = setup(() =>
			Promise.resolve(new Response('', { status: 429, headers: { 'X-Sentry-Rate-Limits': '20::organization' } }))
		)
		transport.send('a', 'error')
		await transport.flush(1000)
		transport.send('b', 'session')
		await transport.flush(1000)
		expect(calls).toHaveLength(1)
	})

	test('drops an event rejected as too large and keeps sending', async () => {
		let status = 413
		const { transport, calls, logs } = setup(() => Promise.resolve(new Response('', { status })))
		transport.send('large', 'error')
		await transport.flush(1000)
		status = 200
		transport.send('small', 'error')
		await transport.flush(1000)
		expect(calls).toHaveLength(2)
		expect(logs).toEqual(['Sentry: an event was too large and was dropped'])
	})

	test('logs a failure once until a send succeeds again', async () => {
		let fail = true
		const { transport, logs } = setup(() => fail ? Promise.reject(new Error('connect ECONNREFUSED')) : ok())
		transport.send('a', 'error')
		transport.send('b', 'error')
		await transport.flush(1000)
		fail = false
		transport.send('c', 'error')
		await transport.flush(1000)
		fail = true
		transport.send('d', 'error')
		await transport.flush(1000)
		expect(logs).toEqual(['Sentry: could not send an event: connect ECONNREFUSED', 'Sentry: could not send an event: connect ECONNREFUSED'])
	})

	test('logs a rejection with its status', async () => {
		const { transport, logs } = setup(() => Promise.resolve(new Response('', { status: 500 })))
		transport.send('a', 'error')
		await transport.flush(1000)
		expect(logs).toEqual(['Sentry: an event was rejected with HTTP 500'])
	})

	test('aborts a delivery after the timeout', async () => {
		const { transport, logs } = setup(
			({ init }) => new Promise((_, reject) => init.signal?.addEventListener('abort', () => reject(new Error('The operation timed out.')))),
			{ timeoutMs: 20 },
		)
		transport.send('a', 'error')
		expect(await transport.flush(1000)).toBe(true)
		expect(logs).toEqual(['Sentry: could not send an event: The operation timed out.'])
	})

	test('drops events over the in-flight cap', async () => {
		const fetch = held()
		const { transport, calls, logs } = setup(fetch.respond, { maxInFlight: 2 })
		transport.send('a', 'error')
		transport.send('b', 'error')
		transport.send('c', 'error')
		fetch.release()
		await transport.flush(1000)
		transport.send('d', 'error')
		fetch.release()
		await transport.flush(1000)
		expect(calls.map(it => it.init.body)).toEqual(['a', 'b', 'd'])
		expect(logs).toEqual(['Sentry: more than 2 events in flight, an event was dropped'])
	})

	test('flush gives up after its timeout and succeeds once deliveries finish', async () => {
		const fetch = held()
		const { transport } = setup(fetch.respond)
		transport.send('a', 'error')
		expect(await transport.flush(20)).toBe(false)
		fetch.release()
		expect(await transport.flush(1000)).toBe(true)
	})
})

describe('rate limit headers', () => {
	test('parseRateLimits', () => {
		expect(parseRateLimits('60:error;transaction:organization, 2::project, x:default:org', 0)).toEqual(
			new Map([['error', 60_000], ['transaction', 60_000], ['all', 2_000], ['default', 60_000]]),
		)
	})

	test('parseRetryAfter', () => {
		const now = Date.parse('2020-01-01T00:00:00Z')
		expect(parseRetryAfter('7', now)).toBe(7_000)
		expect(parseRetryAfter('Wed, 01 Jan 2020 00:00:30 GMT', now)).toBe(30_000)
		expect(parseRetryAfter('Tue, 31 Dec 2019 00:00:00 GMT', now)).toBe(0)
		expect(parseRetryAfter('soon', now)).toBe(60_000)
		expect(parseRetryAfter(null, now)).toBe(60_000)
	})
})
