import { ApiClientError } from './ApiClientError'
import { useApiRequest } from './apiRequest'
import { useTenantGraphQlClient } from './useTenantGraphQlClient'

export const useTenantApiRequest = <SuccessData>() => {
	const client = useTenantGraphQlClient()

	if (client === undefined) {
		throw new ApiClientError(`Cannot use tenant API client.`)
	}

	return useApiRequest<SuccessData>(client)
}
