import { GraphQlClient } from '@contember/client'
import * as React from 'react'
import { useSessionToken } from './auth'
import { useApiBaseUrl } from './config'

export const useGraphQlClient = (path: string) => {
	const apiBaseUrl = useApiBaseUrl()
	const sessionToken = useSessionToken()
	return React.useMemo(() => new GraphQlClient(`${apiBaseUrl}${path}`, sessionToken), [apiBaseUrl, path, sessionToken])
}
