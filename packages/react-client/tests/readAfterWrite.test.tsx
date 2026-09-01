import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { cleanup, renderHook } from '@testing-library/react'
import { ReactNode } from 'react'
import { GraphQlClient, GraphQlClientOptions, WriteRefTracker } from '@contember/graphql-client'
import { ContemberClient } from '../src/components/ContemberClient.js'
import { useReadAfterWriteTrackers } from '../src/contexts.js'
import { useContentGraphQlClient } from '../src/hooks/useContentGraphQlClient.js'
import { useReadAfterWriteTracker } from '../src/hooks/useReadAfterWriteTracker.js'
import { useTenantGraphQlClient } from '../src/hooks/useTenantGraphQlClient.js'

const contentPath = '/content/foo/live'
const otherContentPath = '/content/foo/preview'

// Unmount between the cases: `ContemberClient` reads the session token on mount, so a leftover tree keeps the old one.
afterEach(cleanup)
beforeEach(() => localStorage.clear())

describe('read-after-write trackers', () => {
	it('keeps one tracker per path across renders', () => {
		const wrapper = ({ children }: { children: ReactNode }) => <ContemberClient apiBaseUrl="/api">{children}</ContemberClient>

		const { result, rerender } = renderHook(() => ({
			content: useReadAfterWriteTracker(contentPath),
			otherContent: useReadAfterWriteTracker(otherContentPath),
		}), { wrapper })
		const first = result.current
		rerender()

		expect(first.content).toBeInstanceOf(WriteRefTracker)
		expect(result.current.content).toBe(first.content)
		expect(result.current.otherContent).toBe(first.otherContent)
		expect(first.otherContent).not.toBe(first.content)
	})

	it('starts over when the session token changes', () => {
		let sessionToken = 'first-identity'
		const wrapper = ({ children }: { children: ReactNode }) => (
			<ContemberClient apiBaseUrl="/api" sessionToken={sessionToken}>{children}</ContemberClient>
		)

		const { result, rerender } = renderHook(() => useReadAfterWriteTracker(contentPath), { wrapper })
		const first = result.current
		rerender()
		expect(result.current).toBe(first)

		sessionToken = 'second-identity'
		rerender()

		expect(result.current).toBeInstanceOf(WriteRefTracker)
		expect(result.current).not.toBe(first)
	})

	it('hands out no tracker when read-after-write is off', () => {
		const wrapper = ({ children }: { children: ReactNode }) => <ContemberClient apiBaseUrl="/api" readAfterWrite={false}>{children}</ContemberClient>

		const { result } = renderHook(() => useReadAfterWriteTracker(contentPath), { wrapper })

		expect(result.current).toBeUndefined()
	})

	it('hands out no tracker outside of ContemberClient', () => {
		const { result } = renderHook(() => useReadAfterWriteTracker(contentPath))

		expect(result.current).toBeUndefined()
	})

	it('passes the tracker to the content client only', () => {
		const options: GraphQlClientOptions[] = []
		// One stable factory: a new one on every render would rebuild the clients regardless of the tracker.
		const graphqlClientFactory = (it: GraphQlClientOptions) => {
			options.push(it)
			return new GraphQlClient(it)
		}
		const wrapper = ({ children }: { children: ReactNode }) => (
			<ContemberClient apiBaseUrl="/api" graphqlClientFactory={graphqlClientFactory}>{children}</ContemberClient>
		)

		const { result, rerender } = renderHook(() => ({
			content: useContentGraphQlClient('foo', 'live'),
			tenant: useTenantGraphQlClient(),
			trackers: useReadAfterWriteTrackers(),
		}), { wrapper })
		const contentClient = result.current.content

		const contentOptions = options.find(it => it.url === `/api${contentPath}`)
		const tenantOptions = options.find(it => it.url === '/api/tenant')
		expect(contentOptions).toBeDefined()
		expect(tenantOptions).toBeDefined()
		expect(contentOptions?.readAfterWrite).toBe(result.current.trackers?.get(contentPath))
		expect(contentOptions?.readAfterWrite).toBeInstanceOf(WriteRefTracker)
		expect(tenantOptions?.readAfterWrite).toBeUndefined()
		// A client that never asks for a tracker must not leave one behind either.
		expect(result.current.trackers?.has('/tenant')).toBe(false)

		// The tracker identity must not churn, otherwise every render would build a new client.
		rerender()
		expect(result.current.content).toBe(contentClient)
	})
})
