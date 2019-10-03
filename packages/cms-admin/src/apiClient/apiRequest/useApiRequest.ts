import { GraphQlClient } from 'cms-client'
import * as React from 'react'
import { ApiRequestActionType } from './ApiRequestActionType'
import { ApiRequestReadyState } from './ApiRequestReadyState'
import { ApiRequestReducer, apiRequestReducer } from './apiRequestReducer'
import { ApiRequestState } from './ApiRequestState'

/*

export type SuccessfulApiRequestState<Data> =
	| {
			data: Data
			//extensions: {
			//	dbQueries: any[] // We don't use this yet.
			//}
	  }
	| {
			error: {
				errors: {
					message: string
					code: number
				}[]
			}
	  }
 */

const initialState: ApiRequestState<any> = {
	readyState: ApiRequestReadyState.Uninitialized,
}

export const useApiRequest = <SuccessData>(client: GraphQlClient) => {
	const [state, dispatch] = React.useReducer(apiRequestReducer as ApiRequestReducer<SuccessData>, initialState)

	const isUnmountedRef = React.useRef(false)
	const sendRequest = React.useCallback(
		async (query: string, variables: GraphQlClient.Variables = {}, apiToken?: string) => {
			if (isUnmountedRef.current) {
				return
			}
			dispatch({
				type: ApiRequestActionType.Initialize,
			})
			client
				.sendRequest<SuccessData>(query, variables, apiToken)
				.then(data =>
					dispatch({
						type: ApiRequestActionType.ResolveSuccessfully,
						data,
					}),
				)
				.catch((error: GraphQlClient.FailedRequestMetadata) =>
					dispatch({
						type: ApiRequestActionType.ResolveWithError,
						error,
					}),
				)
		},
		[client],
	)

	React.useEffect(() => () => {
		isUnmountedRef.current = true
	})

	return [state, sendRequest]
}
