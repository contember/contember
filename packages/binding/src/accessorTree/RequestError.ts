import type { GraphQlClient } from '@contember/client'

export enum RequestErrorType {
	Unauthorized = 'unauthorized',
	NetworkError = 'networkError',
	UnknownError = 'unknownError',
}

export interface UnauthorizedRequestError {
	type: RequestErrorType.Unauthorized
}

export interface NetworkErrorRequestError {
	type: RequestErrorType.NetworkError
	metadata: GraphQlClient.FailedRequestMetadata
}

export interface UnknownErrorRequestError {
	type: RequestErrorType.UnknownError
}

export type RequestError = UnauthorizedRequestError | NetworkErrorRequestError | UnknownErrorRequestError
