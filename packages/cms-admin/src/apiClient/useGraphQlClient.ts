import { GraphQlClient } from 'cms-client'
import * as React from 'react'
import { useApiServer } from './useApiServer'

export const useGraphQlClient = (path: string) => {
	const apiServer = useApiServer()
	return React.useMemo(() => {
		if (apiServer !== undefined) {
			return new GraphQlClient(apiServer + path)
		}
		return undefined
	}, [apiServer, path])
}
