import { useCallback, useState } from 'react'
import { MutationRequestState } from './requestState'
import { GraphQlClient } from 'cms-client'

export type UseMutationReturn<R, V> = [(variables: V) => Promise<R>, MutationRequestState<R>]

export const useMutation = <R, V>(client: GraphQlClient, query: string, apiToken?: string): UseMutationReturn<R, V> => {
	const [state, setState] = useState<MutationRequestState<R>>({
		error: false,
		loading: false,
		finished: false,
	})
	const cb = useCallback(
		(variables: V) => {
			if (client) {
				setState({
					loading: true,
					finished: false,
					error: false,
				})
				const response = client.sendRequest<R>(query, variables, apiToken)
				response.then(
					data => {
						setState({
							data: data,
							loading: false,
							finished: true,
							error: false,
						})
					},
					() => {
						setState({
							loading: false,
							finished: true,
							error: true,
						})
					},
				)
				return response
			}
			return Promise.reject()
		},
		[client, query, apiToken],
	)
	return [cb, state]
}
