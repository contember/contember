import type { GraphQlClient } from '@contember/client'

export interface UnauthorizedRequestError {
	type: 'unauthorized'
}

export interface NetworkErrorRequestError {
	type: 'networkError'
	metadata: GraphQlClient.FailedRequestMetadata
}

export interface UnknownErrorRequestError {
	type: 'unknownError'
}

export type RequestError = UnauthorizedRequestError | NetworkErrorRequestError | UnknownErrorRequestError
