import { GraphQlClient, GraphQlClientOptions } from '@contember/graphql-client'
import { useMemo } from 'react'
import { useGraphQlClientFactory, useSessionToken } from '../contexts'
import { useApiBaseUrl } from '../contexts'

const defaultFactory = (options: GraphQlClientOptions): GraphQlClient => new GraphQlClient(options)

export const useGraphQlClient = (path: string): GraphQlClient => {
	const apiBaseUrl = useApiBaseUrl()
	const sessionToken = useSessionToken()
	const factory = useGraphQlClientFactory() || defaultFactory
	return useMemo(() => factory({
		url: `${apiBaseUrl}${path}`,
		apiToken: sessionToken,
	}), [apiBaseUrl, path, sessionToken, factory])
}
