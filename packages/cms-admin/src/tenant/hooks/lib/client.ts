import { useContext, useMemo } from 'react'
import { ConfigContext } from '../../../config'
import GraphqlClient from '../../../model/GraphqlClient'

export const useApiServer = () => {
	const config = useContext(ConfigContext)
	return config !== undefined ? config.apiServer : undefined
}

export const useGraphClient = (path: string) => {
	const apiServer = useApiServer()
	return useMemo(() => {
		if (apiServer !== undefined) {
			return new GraphqlClient(apiServer + path)
		}
		return undefined
	}, [apiServer, path])
}

export const useGraphqlTenantClient = () => {
	return useGraphClient('/tenant')
}

export const useGraphqlContentClient = (project: string, stage: string) => {
	return useGraphClient(`/content/${project}/${stage}`)
}
