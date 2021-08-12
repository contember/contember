import type { GraphQlClient } from '@contember/client'
import { useCallback, useState } from 'react'
import type { MutationRequestState } from './requestState'

export type UseMutationReturn<R, V> = [(variables: V) => Promise<R>, MutationRequestState<R>]

export const useMutation = <R, V>(client: GraphQlClient, query: string, apiToken?: string, headers?: Record<string, string>): UseMutationReturn<R, V> => {
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
				const response = client.sendRequest<{ data: R, extensions?: any }>(query, {
					variables,
					apiTokenOverride: apiToken,
					headers,
				})
				return response.then(
					data => {
						setState({
							...data,
							loading: false,
							finished: true,
							error: false,
						})
						return Promise.resolve(data.data)
					},
					() => {
						setState({
							loading: false,
							finished: true,
							error: true,
						})
						return Promise.reject()
					},
				)
			}
			return Promise.reject()
		},
		[client, query, apiToken, headers],
	)
	return [cb, state]
}
