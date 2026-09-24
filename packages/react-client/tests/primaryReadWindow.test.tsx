import { afterEach, beforeEach, expect, test } from 'bun:test'
import { cleanup, render, renderHook } from '@testing-library/react'
import { ReactNode } from 'react'
import { GraphQlClient, GraphQlClientOptions } from '@contember/graphql-client'
import { ContemberClient } from '../src/components/ContemberClient.js'
import { ApiBaseUrlContext, SessionTokenContext } from '../src/contexts.js'
import { useContentGraphQlClient } from '../src/hooks/useContentGraphQlClient.js'
import { useTenantGraphQlClient } from '../src/hooks/useTenantGraphQlClient.js'

afterEach(cleanup)
beforeEach(() => localStorage.clear())

const createRecordingFactory = () => {
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
	return { requests, factory }
}

test('shares windows by content path and isolates identities, API origins, and other APIs', async () => {
	let sessionToken = 'first'
	let apiBaseUrl = 'https://api.example.com'
	const { requests, factory } = createRecordingFactory()
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

test('nested providers with another identity or origin do not share the outer window', async () => {
	const { requests, factory } = createRecordingFactory()
	const clients = new Map<string, GraphQlClient>()
	const Capture = ({ name }: { name: string }) => {
		clients.set(name, useContentGraphQlClient('test', 'live'))
		return null
	}
	render(
		<ContemberClient apiBaseUrl="https://api.example.com" sessionToken="outer" graphqlClientFactory={factory}>
			<Capture name="outer" />
			<SessionTokenContext.Provider value={{ token: 'nested', propsToken: 'nested', source: 'props' }}>
				<Capture name="otherIdentity" />
			</SessionTokenContext.Provider>
			<ApiBaseUrlContext.Provider value="https://other.example.com">
				<Capture name="otherOrigin" />
			</ApiBaseUrlContext.Provider>
		</ContemberClient>,
	)
	await clients.get('outer')?.execute('mutation { touch }')
	await clients.get('otherIdentity')?.execute('{ marker }')
	await clients.get('otherOrigin')?.execute('{ marker }')
	await clients.get('outer')?.execute('{ marker }')
	expect(requests.map(it => it.primary)).toEqual([null, null, null, '1'])
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
