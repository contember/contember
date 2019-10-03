import { useApiRequest } from './apiRequest'
import { useCurrentContentGraphQlClient } from './useCurrentContentGraphQlClient'

export const useContentApiRequest = <SuccessData>() => {
	const client = useCurrentContentGraphQlClient()

	if (client === undefined) {
		throw new Error()
	}

	return useApiRequest<SuccessData>(client)
}
