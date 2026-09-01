import { GraphQlClient, GraphQlClientOptions } from '@contember/graphql-client'
import { useMemo } from 'react'
import { useGraphQlClientFactory, useSessionToken } from '../contexts.js'
import { useApiBaseUrl } from '../contexts.js'
import { useReadAfterWriteTracker } from './useReadAfterWriteTracker.js'

const defaultFactory = (options: GraphQlClientOptions): GraphQlClient => new GraphQlClient(options)

export interface UseGraphQlClientOptions {
	/** Only the content API can be read from a replica, so only it asks for a tracker. */
	readonly readAfterWrite?: boolean
}

export const useGraphQlClient = (path: string, options: UseGraphQlClientOptions = {}): GraphQlClient => {
	const apiBaseUrl = useApiBaseUrl()
	const sessionToken = useSessionToken()
	const factory = useGraphQlClientFactory() || defaultFactory
	const readAfterWrite = useReadAfterWriteTracker(path, options.readAfterWrite === true)
	return useMemo(() =>
		factory({
			url: `${apiBaseUrl}${path}`,
			apiToken: sessionToken,
			readAfterWrite,
		}), [apiBaseUrl, path, sessionToken, factory, readAfterWrite])
}
