import { ApiClientError } from './ApiClientError'
import { useApiRequest } from './apiRequest'
import { useCurrentContentGraphQlClient } from './useCurrentContentGraphQlClient'

export const useContentApiRequest = <SuccessData>() => {
	const client = useCurrentContentGraphQlClient()

	if (client === undefined) {
		throw new ApiClientError(`Cannot use content API client.`)
	}

	return useApiRequest<SuccessData>(client)
}
