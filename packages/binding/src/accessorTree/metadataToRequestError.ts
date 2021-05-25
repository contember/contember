import type { GraphQlClient } from '@contember/client'
import { RequestError, RequestErrorType } from './RequestError'

export const metadataToRequestError = (metadata: GraphQlClient.FailedRequestMetadata): RequestError => {
	if (metadata.status === 401) {
		return {
			type: RequestErrorType.Unauthorized,
		}
	}
	return {
		type: RequestErrorType.NetworkError,
		metadata: metadata,
	}
}
