import { ClientError } from './ClientError'
import { useApiRequest } from './apiRequest'
import { useCurrentContentGraphQlClient } from './useCurrentContentGraphQlClient'

export const useContentApiRequest = <SuccessData>() => {
	const client = useCurrentContentGraphQlClient()

	if (client === undefined) {
		throw new ClientError(`Cannot use content API client.`)
	}

	return useApiRequest<SuccessData>(client)
}
