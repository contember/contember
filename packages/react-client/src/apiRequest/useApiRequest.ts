import type {
	GraphQlClient,
	GraphQlClientFailedRequestMetadata,
	GraphQlClientRequestOptions,
	GraphQlClientVariables,
} from '@contember/client'
import { useCallback, useEffect, useReducer, useRef } from 'react'
import { ApiRequestReducer, apiRequestReducer } from './apiRequestReducer'
import type { ApiRequestState } from './ApiRequestState'

const initialState: ApiRequestState<any> = {
	isLoading: false,
	isFinished: false,
	readyState: 'uninitialized',
}

export type UseApiRequestResult<SuccessData> = [
	ApiRequestState<SuccessData>,
	(
		query: string,
		variables?: GraphQlClientVariables,
		options?: Omit<GraphQlClientRequestOptions, 'variables'>,
	) => Promise<SuccessData>,
]

export const useApiRequest = <SuccessData>(client: GraphQlClient): UseApiRequestResult<SuccessData> => {
	const [state, dispatch] = useReducer(apiRequestReducer as ApiRequestReducer<SuccessData>, initialState)

	const isUnmountedRef = useRef(false)
	const sendRequest = useCallback(
		async (
			query: string,
			variables: GraphQlClientVariables = {},
			options?: Omit<GraphQlClientRequestOptions, 'variables'>,
		): Promise<SuccessData> => {
			if (isUnmountedRef.current) {
				return Promise.reject()
			}
			dispatch({
				type: 'initialize',
			})
			return client
				.sendRequest<SuccessData>(query, {
					...options,
					variables,
				})
				.then(data => {
					dispatch({
						type: 'resolveSuccessfully',
						data,
					})
					return Promise.resolve(data)
				})
				.catch((error: GraphQlClientFailedRequestMetadata) => {
					dispatch({
						type: 'resolveWithError',
						error,
					})
					return Promise.reject(error)
				})
		},
		[client],
	)

	useEffect(
		() => () => {
			isUnmountedRef.current = true
		},
		[], // This empty array is crucial! Otherwise it will first "unmount" before second render no matter what.
	)

	return [state, sendRequest]
}
