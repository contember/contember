import { afterEach, describe, expect, setSystemTime, test } from 'bun:test'
import { GraphQlClient, GraphQlClientError, GraphQlClientRequestOptions, GraphQlErrorType } from '../../../src/index.js'

const failingClient = (error: unknown) =>
	new GraphQlClient({
		url: 'http://localhost/content',
		fetcher: async () => {
			throw error
		},
	})

const errorType = async (client: GraphQlClient, options?: GraphQlClientRequestOptions): Promise<GraphQlErrorType> => {
	try {
		await client.execute('query { ok }', options)
	} catch (e) {
		if (e instanceof GraphQlClientError) {
			return e.type
		}
		throw e
	}
	throw new Error('Expected the request to fail')
}

const browserCancelled = () => new TypeError('Load failed')

describe('client', () => {
	afterEach(() => {
		globalThis.dispatchEvent(new Event('pageshow'))
		setSystemTime()
	})

	test('returns data of a successful response', async () => {
		const client = new GraphQlClient({
			url: 'http://localhost/content',
			fetcher: async () => new Response(JSON.stringify({ data: { ok: true } })),
		})
		expect(await client.execute<{ ok: boolean }>('query { ok }')).toEqual({ ok: true })
	})

	test('an AbortError is an aborted request', async () => {
		expect(await errorType(failingClient(new DOMException('The operation was aborted.', 'AbortError')))).toBe('aborted')
	})

	test('a fetch failure after the caller aborted the signal is an aborted request', async () => {
		const controller = new AbortController()
		controller.abort()
		expect(await errorType(failingClient(browserCancelled()), { signal: controller.signal })).toBe('aborted')
	})

	test('a timeout of the signal passed by the caller is a network error', async () => {
		const controller = new AbortController()
		const timeout = new DOMException('The operation timed out.', 'TimeoutError')
		controller.abort(timeout)
		expect(await errorType(failingClient(timeout), { signal: controller.signal })).toBe('network error')
	})

	test('a fetch failure while the page stays is a network error', async () => {
		expect(await errorType(failingClient(browserCancelled()))).toBe('network error')
	})

	test('a fetch failure after pagehide is an aborted request until the page is shown again', async () => {
		const client = failingClient(browserCancelled())
		globalThis.dispatchEvent(new Event('pagehide'))
		expect(await errorType(client)).toBe('aborted')
		globalThis.dispatchEvent(new Event('pageshow'))
		expect(await errorType(client)).toBe('network error')
	})

	test('a fetch failure right after beforeunload is an aborted request, later it is a network error again', async () => {
		setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
		const client = failingClient(browserCancelled())
		globalThis.dispatchEvent(new Event('beforeunload'))
		setSystemTime(new Date('2026-01-01T00:00:00.999Z'))
		expect(await errorType(client)).toBe('aborted')
		// The navigation did not happen (a download link, a cancelled prompt): the page stays.
		setSystemTime(new Date('2026-01-01T00:00:01.000Z'))
		expect(await errorType(client)).toBe('network error')
	})

	test('a 5xx response is a server error, even while the page is leaving', async () => {
		const client = new GraphQlClient({
			url: 'http://localhost/content',
			fetcher: async () => new Response(JSON.stringify({ errors: [{ message: 'Internal server error' }] }), { status: 500 }),
		})
		expect(await errorType(client)).toBe('server error')
		globalThis.dispatchEvent(new Event('pagehide'))
		expect(await errorType(client)).toBe('server error')
	})
})
