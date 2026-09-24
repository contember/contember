import { describe, expect, test } from 'bun:test'
import { GraphQlClient, GraphQlClientOptions, PrimaryReadWindow } from '../../../src/index.js'

const mutationResponse = (body = { data: { ok: true } }): Response => new Response(JSON.stringify(body), { headers: { 'X-Contember-Mutation': '1' } })

describe('primary read window', () => {
	test('starts on response receipt, expires exactly at the deadline, and extends on another mutation', () => {
		let now = 100
		const window = new PrimaryReadWindow({ now: () => now })
		expect(window.requestHeaders()).toEqual({})
		window.captureResponse(mutationResponse())
		now = 1099
		expect(window.requestHeaders()).toEqual({ 'X-Contember-Force-Primary': '1' })
		window.captureResponse(mutationResponse())
		now = 1100
		expect(window.requestHeaders()).toEqual({ 'X-Contember-Force-Primary': '1' })
		now = 2099
		expect(window.requestHeaders()).toEqual({})
	})

	test('query responses do not extend the window', () => {
		let now = 0
		const window = new PrimaryReadWindow({ durationMs: 200, now: () => now })
		window.captureResponse(mutationResponse())
		now = 199
		window.captureResponse(new Response('{}'))
		now = 200
		expect(window.requestHeaders()).toEqual({})
	})

	test('zero disables the window and invalid durations are rejected', () => {
		const window = new PrimaryReadWindow({ durationMs: 0 })
		window.captureResponse(mutationResponse())
		expect(window.requestHeaders()).toEqual({})
		for (const durationMs of [-1, NaN, Infinity]) {
			expect(() => new PrimaryReadWindow({ durationMs })).toThrow('finite non-negative')
		}
	})
})

describe('GraphQlClient primary reads', () => {
	const setup = (response: () => Response = mutationResponse) => {
		const headers: Headers[] = []
		const window = new PrimaryReadWindow()
		const options: GraphQlClientOptions = {
			url: 'https://api.example.com/content/test/live',
			primaryReadWindow: window,
			fetcher: async (_url, init) => {
				headers.push(new Headers(init?.headers))
				return response()
			},
		}
		return { client: new GraphQlClient(options), headers, window, options }
	}

	test('shares the window across clients and withOptions; explicit headers and per-request opt-out win', async () => {
		const { client, headers, options } = setup()
		await client.execute('mutation { createArticle { ok } }')
		await new GraphQlClient(options).execute('{ listArticle { id } }')
		await client.withOptions({ apiToken: 'same-identity' }).execute('{ listArticle { id } }')
		await client.execute('{ listArticle { id } }', { primaryReadWindow: false })
		await client.execute('{ listArticle { id } }', { headers: { 'X-Contember-Force-Primary': '0' } })
		await client.execute('{ listArticle { id } }', { headers: { 'x-contember-force-primary': '0' } })
		expect(headers.map(it => it.get('X-Contember-Force-Primary'))).toEqual([null, '1', '1', null, '0', '0'])
	})

	test('captures mutation responses with GraphQL errors or a failing user callback', async () => {
		const { client, window } = setup(() =>
			new Response(JSON.stringify({ data: { first: { ok: true } }, errors: [{ message: 'second failed' }] }), {
				headers: { 'X-Contember-Mutation': '1' },
			})
		)
		await expect(client.execute('mutation { first { ok } second { ok } }')).rejects.toMatchObject({ type: 'response errors' })
		expect(window.requestHeaders()).toEqual({ 'X-Contember-Force-Primary': '1' })

		const other = new PrimaryReadWindow()
		await expect(client.execute('mutation { first { ok } }', {
			primaryReadWindow: other,
			onResponse: () => {
				throw new Error('hook failed')
			},
		})).rejects.toMatchObject({ type: 'network error' })
		expect(other.requestHeaders()).toEqual({ 'X-Contember-Force-Primary': '1' })
	})

	test('a failed body read still opens the window; a failed request does not', async () => {
		const brokenBody = new ReadableStream<Uint8Array>({
			pull: controller => controller.error(new Error('connection reset')),
		}, { highWaterMark: 0 })
		const { client, window } = setup(() => new Response(brokenBody, { headers: { 'X-Contember-Mutation': '1' } }))
		await expect(client.execute('mutation { touch }')).rejects.toMatchObject({ type: 'network error' })
		expect(window.requestHeaders()).toEqual({ 'X-Contember-Force-Primary': '1' })

		const rejectedWindow = new PrimaryReadWindow()
		const rejecting = new GraphQlClient({
			url: 'https://api.example.com/content/test/live',
			primaryReadWindow: rejectedWindow,
			fetcher: () => Promise.reject(new TypeError('Failed to fetch')),
		})
		await expect(rejecting.execute('mutation { touch }')).rejects.toMatchObject({ type: 'network error' })
		expect(rejectedWindow.requestHeaders()).toEqual({})
	})

	test('the window starts after the response body has been read', async () => {
		let now = 0
		const window = new PrimaryReadWindow({ now: () => now })
		const body = new ReadableStream<Uint8Array>({
			pull: controller => {
				now = 500
				controller.enqueue(new TextEncoder().encode('{"data":{}}'))
				controller.close()
			},
		}, { highWaterMark: 0 })
		const client = new GraphQlClient({
			url: 'https://api.example.com/content/test/live',
			primaryReadWindow: window,
			fetcher: async () => new Response(body, { headers: { 'X-Contember-Mutation': '1' } }),
		})
		await client.execute('mutation { touch }')
		now = 1499
		expect(window.requestHeaders()).toEqual({ 'X-Contember-Force-Primary': '1' })
		now = 1500
		expect(window.requestHeaders()).toEqual({})
	})

	test('unmarked responses do not start a window, regardless of query text', async () => {
		const { client, window } = setup(() => new Response('{"data":{}}'))
		await client.execute('query { mutation }')
		expect(window.requestHeaders()).toEqual({})
	})

	test('a request can replace the client-wide window or opt out of capturing', async () => {
		const { client, window } = setup()
		const other = new PrimaryReadWindow()
		await client.execute('mutation { touch }', { primaryReadWindow: other })
		expect(other.requestHeaders()).toEqual({ 'X-Contember-Force-Primary': '1' })
		expect(window.requestHeaders()).toEqual({})
		await client.execute('mutation { touch }', { primaryReadWindow: false })
		expect(window.requestHeaders()).toEqual({})
	})
})
