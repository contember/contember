import { describe, expect, test } from 'bun:test'
import { GraphQlClient, GraphQlClientError, READ_AFTER_WRITE_HEADERS, WriteRefTracker } from '../../../src/index.js'

interface FakeServerOptions {
	readonly body?: string
	readonly responseHeaders?: Record<string, string>
}

const createFakeServer = ({ body = '{"data":{}}', responseHeaders = {} }: FakeServerOptions = {}) => {
	const requests: Headers[] = []
	const fetcher = async (_input: RequestInfo, init?: RequestInit): Promise<Response> => {
		requests.push(new Headers(init?.headers))
		return new Response(body, { headers: responseHeaders })
	}
	return {
		fetcher,
		lastRequestHeaders: (): Headers => {
			const last = requests[requests.length - 1]
			if (last === undefined) {
				throw new Error('No request was sent.')
			}
			return last
		},
	}
}

const captureError = async (operation: Promise<unknown>): Promise<unknown> => await operation.then(() => undefined, (error: unknown) => error)

describe('GraphQlClient read-after-write', () => {
	test('sends the outstanding tokens', async () => {
		const server = createFakeServer()
		const tracker = new WriteRefTracker()
		tracker.captureResponse(new Response('{}', { headers: { [READ_AFTER_WRITE_HEADERS.writeRef]: '123' } }))
		const client = new GraphQlClient({ url: '/content', fetcher: server.fetcher, readAfterWrite: tracker })

		await client.execute('query {}')

		expect(server.lastRequestHeaders().get(READ_AFTER_WRITE_HEADERS.readAfter)).toBe('123')
	})

	test('sends no header when nothing is outstanding', async () => {
		const server = createFakeServer()
		const client = new GraphQlClient({ url: '/content', fetcher: server.fetcher, readAfterWrite: new WriteRefTracker() })

		await client.execute('query {}')

		expect(server.lastRequestHeaders().has(READ_AFTER_WRITE_HEADERS.readAfter)).toBe(false)
	})

	test('an explicit header wins over the tracker', async () => {
		const server = createFakeServer()
		const tracker = new WriteRefTracker()
		tracker.captureResponse(new Response('{}', { headers: { [READ_AFTER_WRITE_HEADERS.writeRef]: '123' } }))
		const client = new GraphQlClient({ url: '/content', fetcher: server.fetcher, readAfterWrite: tracker })

		await client.execute('query {}', { headers: { [READ_AFTER_WRITE_HEADERS.readAfter]: '456' } })

		expect(server.lastRequestHeaders().get(READ_AFTER_WRITE_HEADERS.readAfter)).toBe('456')
	})

	test('captures the write reference of a response', async () => {
		const server = createFakeServer({ responseHeaders: { [READ_AFTER_WRITE_HEADERS.writeRef]: '123' } })
		const tracker = new WriteRefTracker()
		const client = new GraphQlClient({ url: '/content', fetcher: server.fetcher, readAfterWrite: tracker })

		await client.execute('mutation {}')

		expect(tracker.tokens).toEqual(['123'])
	})

	test('captures the write reference even when the body carries errors', async () => {
		const server = createFakeServer({
			body: '{"data":{},"errors":[{"message":"nope"}]}',
			responseHeaders: { [READ_AFTER_WRITE_HEADERS.writeRef]: '123' },
		})
		const tracker = new WriteRefTracker()
		const client = new GraphQlClient({ url: '/content', fetcher: server.fetcher, readAfterWrite: tracker })

		const error = await captureError(client.execute('mutation {}'))

		if (!(error instanceof GraphQlClientError)) {
			throw new Error('Expected the request to fail with a GraphQlClientError.')
		}
		expect(error.type).toBe('response errors')
		expect(tracker.tokens).toEqual(['123'])
	})

	test('drops the acknowledged tokens', async () => {
		const server = createFakeServer({ responseHeaders: { [READ_AFTER_WRITE_HEADERS.readAfterVisible]: '123' } })
		const tracker = new WriteRefTracker()
		tracker.captureResponse(new Response('{}', { headers: { [READ_AFTER_WRITE_HEADERS.writeRef]: '123' } }))
		const client = new GraphQlClient({ url: '/content', fetcher: server.fetcher, readAfterWrite: tracker })

		await client.execute('query {}')

		expect(tracker.tokens).toEqual([])
	})

	test('a per-request tracker wins over the client one', async () => {
		const server = createFakeServer({ responseHeaders: { [READ_AFTER_WRITE_HEADERS.writeRef]: 'fresh' } })
		const clientTracker = new WriteRefTracker()
		clientTracker.captureResponse(new Response('{}', { headers: { [READ_AFTER_WRITE_HEADERS.writeRef]: 'client' } }))
		const requestTracker = new WriteRefTracker()
		requestTracker.captureResponse(new Response('{}', { headers: { [READ_AFTER_WRITE_HEADERS.writeRef]: 'request' } }))
		const client = new GraphQlClient({ url: '/content', fetcher: server.fetcher, readAfterWrite: clientTracker })

		await client.execute('query {}', { readAfterWrite: requestTracker })

		expect(server.lastRequestHeaders().get(READ_AFTER_WRITE_HEADERS.readAfter)).toBe('request')
		expect(requestTracker.tokens).toEqual(['request', 'fresh'])
		expect(clientTracker.tokens).toEqual(['client'])
	})

	test('withOptions keeps the tracker', async () => {
		const server = createFakeServer()
		const tracker = new WriteRefTracker()
		tracker.captureResponse(new Response('{}', { headers: { [READ_AFTER_WRITE_HEADERS.writeRef]: '123' } }))
		const client = new GraphQlClient({ url: '/content', fetcher: server.fetcher, readAfterWrite: tracker })

		await client.withOptions({ apiToken: 'token' }).execute('query {}')

		expect(server.lastRequestHeaders().get(READ_AFTER_WRITE_HEADERS.readAfter)).toBe('123')
	})
})
