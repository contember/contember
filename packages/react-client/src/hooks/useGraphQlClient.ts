import { GraphQlClient, GraphQlClientOptions, PrimaryReadWindow } from '@contember/graphql-client'
import { useMemo } from 'react'
import { useGraphQlClientFactory, usePrimaryReadWindows, useSessionToken } from '../contexts.js'
import { useApiBaseUrl } from '../contexts.js'

const defaultFactory = (options: GraphQlClientOptions): GraphQlClient => new GraphQlClient(options)

export const useGraphQlClient = (path: string, options: { primaryReadWindow?: boolean } = {}): GraphQlClient => {
	const apiBaseUrl = useApiBaseUrl()
	const sessionToken = useSessionToken()
	const factory = useGraphQlClientFactory() || defaultFactory
	const windows = usePrimaryReadWindows()
	let primaryReadWindow: PrimaryReadWindow | undefined
	if (options.primaryReadWindow && windows !== undefined && windows.durationMs !== 0) {
		primaryReadWindow = windows.windows.get(path)
		if (primaryReadWindow === undefined) {
			primaryReadWindow = new PrimaryReadWindow({ durationMs: windows.durationMs })
			windows.windows.set(path, primaryReadWindow)
		}
	}
	return useMemo(() =>
		factory({
			url: `${apiBaseUrl}${path}`,
			apiToken: sessionToken,
			primaryReadWindow,
		}), [apiBaseUrl, path, sessionToken, factory, primaryReadWindow])
}
