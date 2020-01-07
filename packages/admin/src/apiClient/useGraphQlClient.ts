import { GraphQlClient } from '@contember/client'
import * as React from 'react'
import { useApiBaseUrl } from './config'

export const useGraphQlClient = (path: string) => {
	const apiBaseUrl = useApiBaseUrl()
	return React.useMemo(() => new GraphQlClient(apiBaseUrl + path), [apiBaseUrl, path])
}
