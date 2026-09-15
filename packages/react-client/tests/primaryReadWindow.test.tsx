import { afterEach, beforeEach, expect, test } from 'bun:test'
import { cleanup, renderHook } from '@testing-library/react'
import { ReactNode } from 'react'
import { GraphQlClient, GraphQlClientOptions } from '@contember/graphql-client'
import { ContemberClient } from '../src/components/ContemberClient.js'
import { useContentGraphQlClient } from '../src/hooks/useContentGraphQlClient.js'
import { useTenantGraphQlClient } from '../src/hooks/useTenantGraphQlClient.js'

afterEach(cleanup)
beforeEach(() => localStorage.clear())

test('shares windows by content path and isolates identities, API origins, and other APIs', async () => {
	let sessionToken = 'first'
	let apiBaseUrl = 'https://api.example.com'
	const requests: { url: string; primary: string | null }[] = []
	const factory = (options: GraphQlClientOptions) =>
		new GraphQlClient({
			...options,
			fetcher: async (_url, init) => {
				requests.push({ url: options.url, primary: new Headers(init?.headers).get('X-Contember-Force-Primary') })
				return new Response('{"data":{}}', {
					headers: init?.body === JSON.stringify({ query: 'mutation { touch }' }) ? { 'X-Contember-Mutation': '1' } : {},
				})
			},
		})
	const wrapper = ({ children }: { children: ReactNode }) => (
		<ContemberClient apiBaseUrl={apiBaseUrl} sessionToken={sessionToken} graphqlClientFactory={factory}>{children}</ContemberClient>
	)
	const { result, rerender } = renderHook(() => ({
		writer: useContentGraphQlClient('test', 'live'),
		reader: useContentGraphQlClient('test', 'live'),
		otherStage: useContentGraphQlClient('test', 'preview'),
		tenant: useTenantGraphQlClient(),
	}), { wrapper })
	await result.current.writer.execute('mutation { touch }')
	const reader = result.current.reader
	await result.current.reader.execute('{ marker }')
	await result.current.otherStage.execute('{ marker }')
	await result.current.tenant.execute('{ marker }')
	const sameOrigin = requests.map(it => it.primary)
	expect(sameOrigin).toEqual([null, '1', null, null])
	rerender()
	expect(result.current.reader).toBe(reader)
	sessionToken = 'second'
	rerender()
	await result.current.reader.execute('{ marker }')
	expect(requests.at(-1)?.primary).toBeNull()
	await result.current.writer.execute('mutation { touch }')
	apiBaseUrl = 'https://other.example.com'
	rerender()
	await result.current.reader.execute('{ marker }')
	expect(requests.at(-1)?.primary).toBeNull()
})

test('zero disables the default content window', async () => {
	const options: GraphQlClientOptions[] = []
	const factory = (value: GraphQlClientOptions) => {
		options.push(value)
		return new GraphQlClient(value)
	}
	const wrapper = ({ children }: { children: ReactNode }) => (
		<ContemberClient apiBaseUrl="/api" primaryReadWindowMs={0} graphqlClientFactory={factory}>{children}</ContemberClient>
	)
	renderHook(() => useContentGraphQlClient('test', 'live'), { wrapper })
	expect(options).toHaveLength(1)
	expect(options[0].primaryReadWindow).toBeUndefined()
})
