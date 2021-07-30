import type { GraphQlClientFailedRequestMetadata } from '@contember/client'

export interface UnauthorizedRequestError {
	type: 'unauthorized'
}

export interface NetworkErrorRequestError {
	type: 'networkError'
	metadata: GraphQlClientFailedRequestMetadata
}

export interface UnknownErrorRequestError {
	type: 'unknownError'
}

export type RequestError = UnauthorizedRequestError | NetworkErrorRequestError | UnknownErrorRequestError
