import type { GraphQlClient } from '@contember/client'
import { useCallback, useEffect, useReducer, useRef } from 'react'
import { ApiRequestReducer, apiRequestReducer } from './apiRequestReducer'
import type { ApiRequestState } from './ApiRequestState'

const initialState: ApiRequestState<any> = {
	isLoading: false,
	isFinished: false,
	readyState: 'uninitialized',
}

export const useApiRequest = <SuccessData>(
	client: GraphQlClient,
): [
	ApiRequestState<SuccessData>,
	(
		query: string,
		variables?: GraphQlClient.Variables,
		options?: Omit<GraphQlClient.RequestOptions, 'variables'>,
	) => Promise<SuccessData>,
] => {
	const [state, dispatch] = useReducer(apiRequestReducer as ApiRequestReducer<SuccessData>, initialState)

	const isUnmountedRef = useRef(false)
	const sendRequest = useCallback(
		async (
			query: string,
			variables: GraphQlClient.Variables = {},
			options?: Omit<GraphQlClient.RequestOptions, 'variables'>,
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
				.catch((error: GraphQlClient.FailedRequestMetadata) => {
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
