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

export interface GqlError {
	type: 'gqlError'
	query: string,
	errors: { message: string, path?: string[] }[]
}

export type RequestError = UnauthorizedRequestError | NetworkErrorRequestError | GqlError | UnknownErrorRequestError
