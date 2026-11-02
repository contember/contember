import { describe, expect, test } from 'bun:test'
import { CredentialsProvider, CredentialsRequest, GraphQlClient, GraphQlClientError } from '../../../src/index.js'

const url = 'https://api.example.com/content/web/live'

const createProvider = () => {
	const calls: CredentialsRequest[] = []
	const provider: CredentialsProvider = {
		authenticate: async request => {
			calls.push(request)
			return { Authorization: `DPoP token-${calls.length}`, DPoP: `proof-${calls.length}` }
		},
	}
	return { provider, calls }
}

const createFetcher = (statuses: number[]) => {
	const requests: Headers[] = []
	const fetcher = async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
		requests.push(new Headers(init?.headers))
		const status = statuses[requests.length - 1] ?? 200
		const body = status === 200 ? { data: { ok: true } } : { errors: [{ code: status, message: 'Authorization failure: invalid token' }] }
		return new Response(JSON.stringify(body), { status })
	}
	return { fetcher, requests }
}

const catchError = async (promise: Promise<unknown>): Promise<unknown> => {
	try {
		await promise
	} catch (e) {
		return e
	}
	throw new Error('expected a rejection')
}

describe('credentials', () => {
	test('authenticates every request and merges the returned headers', async () => {
		const { provider, calls } = createProvider()
		const { fetcher, requests } = createFetcher([200, 200])
		const client = new GraphQlClient({ url, credentials: provider, fetcher, headers: { 'X-Custom': '1' } })

		expect(await client.execute<{ ok: boolean }>('{ ok }')).toEqual({ ok: true })
		expect(await client.execute<{ ok: boolean }>('{ ok }')).toEqual({ ok: true })

		expect(calls).toEqual([
			{ url, method: 'POST', refresh: false },
			{ url, method: 'POST', refresh: false },
		])
		expect(requests.map(it => [it.get('Authorization'), it.get('DPoP'), it.get('X-Custom')])).toEqual([
			['DPoP token-1', 'proof-1', '1'],
			['DPoP token-2', 'proof-2', '1'],
		])
	})

	test('retries once on 401 with refresh: true', async () => {
		const { provider, calls } = createProvider()
		const { fetcher, requests } = createFetcher([401, 200])
		const responses: number[] = []
		const client = new GraphQlClient({ url, credentials: provider, fetcher, onResponse: it => responses.push(it.status) })

		expect(await client.execute<{ ok: boolean }>('mutation { ok }')).toEqual({ ok: true })
		expect(calls.map(it => it.refresh)).toEqual([false, true])
		expect(requests.map(it => it.get('Authorization'))).toEqual(['DPoP token-1', 'DPoP token-2'])
		expect(responses).toEqual([200])
	})

	test('a second 401 surfaces as unauthorized', async () => {
		const { provider, calls } = createProvider()
		const { fetcher, requests } = createFetcher([401, 401, 200])
		const client = new GraphQlClient({ url, credentials: provider, fetcher })

		const error = await catchError(client.execute('{ ok }'))
		expect(error).toBeInstanceOf(GraphQlClientError)
		expect(error instanceof GraphQlClientError && error.type).toBe('unauthorized')
		expect(calls.map(it => it.refresh)).toEqual([false, true])
		expect(requests).toHaveLength(2)
	})

	test('403 is not retried', async () => {
		const { provider, calls } = createProvider()
		const { fetcher, requests } = createFetcher([403, 200])
		const client = new GraphQlClient({ url, credentials: provider, fetcher })

		const error = await catchError(client.execute('{ ok }'))
		expect(error instanceof GraphQlClientError && error.type).toBe('forbidden')
		expect(calls).toHaveLength(1)
		expect(requests).toHaveLength(1)
	})

	test('401 without credentials is not retried', async () => {
		const { fetcher, requests } = createFetcher([401, 200])
		const client = new GraphQlClient({ url, apiToken: 'abc', fetcher })

		const error = await catchError(client.execute('{ ok }'))
		expect(error instanceof GraphQlClientError && error.type).toBe('unauthorized')
		expect(requests.map(it => it.get('Authorization'))).toEqual(['Bearer abc'])
	})

	test('a provider failure propagates unchanged and sends nothing', async () => {
		const { fetcher, requests } = createFetcher([200])
		const failure = new Error('token source unavailable')
		const client = new GraphQlClient({
			url,
			fetcher,
			credentials: {
				authenticate: async () => {
					throw failure
				},
			},
		})

		expect(await catchError(client.execute('{ ok }'))).toBe(failure)
		expect(requests).toHaveLength(0)
	})

	test('credentials together with apiToken is an error', async () => {
		const { provider } = createProvider()
		const { fetcher, requests } = createFetcher([200])
		expect(() => new GraphQlClient({ url, credentials: provider, apiToken: 'abc' })).toThrow('either `credentials` or `apiToken`')

		const client = new GraphQlClient({ url, credentials: provider, fetcher })
		expect(() => client.withOptions({ apiToken: 'abc' })).toThrow('either `credentials` or `apiToken`')
		expect(await catchError(client.execute('{ ok }', { apiToken: 'abc' }))).toBeInstanceOf(Error)
		expect(requests).toHaveLength(0)
	})

	test('withOptions keeps the credentials', async () => {
		const { provider, calls } = createProvider()
		const { fetcher, requests } = createFetcher([200])
		const client = new GraphQlClient({ url: 'https://other.example.com', credentials: provider, fetcher }).withOptions({ url })

		await client.execute('{ ok }')
		expect(calls).toEqual([{ url, method: 'POST', refresh: false }])
		expect(requests[0].get('Authorization')).toBe('DPoP token-1')
	})
})
