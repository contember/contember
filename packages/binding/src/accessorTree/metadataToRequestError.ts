import type { GraphQlClient } from '@contember/client'
import type { RequestError } from './RequestError'

export const metadataToRequestError = (metadata: GraphQlClient.FailedRequestMetadata): RequestError => {
	if (metadata.status === 401) {
		return {
			type: 'unauthorized',
		}
	}
	return {
		type: 'networkError',
		metadata: metadata,
	}
}
