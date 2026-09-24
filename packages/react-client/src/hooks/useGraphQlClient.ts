import { GraphQlClient, GraphQlClientOptions } from '@contember/graphql-client'
import { useMemo } from 'react'
import { useGraphQlClientFactory, useSessionToken } from '../contexts.js'
import { useApiBaseUrl } from '../contexts.js'
import { usePrimaryReadWindows } from '../primaryReadWindows.js'

const defaultFactory = (options: GraphQlClientOptions): GraphQlClient => new GraphQlClient(options)

export const useGraphQlClient = (path: string, options: { primaryReadWindow?: boolean } = {}): GraphQlClient => {
	const apiBaseUrl = useApiBaseUrl()
	const sessionToken = useSessionToken()
	const factory = useGraphQlClientFactory() || defaultFactory
	const primaryReadWindows = usePrimaryReadWindows()
	const url = `${apiBaseUrl}${path}`
	const primaryReadWindow = options.primaryReadWindow ? primaryReadWindows?.get(url, sessionToken) : undefined
	return useMemo(() =>
		factory({
			url,
			apiToken: sessionToken,
			primaryReadWindow,
		}), [url, sessionToken, factory, primaryReadWindow])
}
