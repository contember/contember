import type { GraphQlClientFailedRequestMetadata } from '@contember/client'
import type { RequestError } from './RequestError'

export const metadataToRequestError = (metadata: GraphQlClientFailedRequestMetadata): RequestError => {
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
