import { GraphQlClient } from '@contember/client'
import { useMemo } from 'react'
import { useSessionToken } from '../contexts'
import { useApiBaseUrl } from '../contexts'

export const useGraphQlClient = (path: string): GraphQlClient => {
	const apiBaseUrl = useApiBaseUrl()
	const sessionToken = useSessionToken()
	return useMemo(() => new GraphQlClient({
		url: `${apiBaseUrl}${path}`,
		apiToken: sessionToken,
	}), [apiBaseUrl, path, sessionToken])
}
