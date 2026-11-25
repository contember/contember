import { describe, expect, test } from 'bun:test'
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

// What Chrome and Safari reject a cancelled fetch with, and also a real network failure.
const fetchFailed = () => new TypeError('Load failed')

describe('client', () => {
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
		expect(await errorType(failingClient(fetchFailed()), { signal: controller.signal })).toBe('aborted')
	})

	test('a timeout of the signal passed by the caller is a network error', async () => {
		const controller = new AbortController()
		const timeout = new DOMException('The operation timed out.', 'TimeoutError')
		controller.abort(timeout)
		expect(await errorType(failingClient(timeout), { signal: controller.signal })).toBe('network error')
	})

	test('a fetch failure without an aborted signal is a network error', async () => {
		expect(await errorType(failingClient(fetchFailed()))).toBe('network error')
	})

	test('a 5xx response is a server error', async () => {
		const client = new GraphQlClient({
			url: 'http://localhost/content',
			fetcher: async () => new Response(JSON.stringify({ errors: [{ message: 'Internal server error' }] }), { status: 500 }),
		})
		expect(await errorType(client)).toBe('server error')
	})
})
