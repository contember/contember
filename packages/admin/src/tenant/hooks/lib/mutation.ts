import type { GraphQlClient } from '@contember/client'
import { useCallback, useState } from 'react'
import type { MutationRequestState } from './requestState'

export type UseMutationReturn<R, V> = [(variables: V) => Promise<R>, MutationRequestState<R>]

export const useMutation = <R, V>(client: GraphQlClient, query: string, apiToken?: string, headers?: Record<string, string>): UseMutationReturn<R, V> => {
	const [state, setState] = useState<MutationRequestState<R>>({
		state: 'initial',
	})
	const cb = useCallback(
		async (variables: V) => {
			setState({
				state: 'loading',
			})
			try {
				const response = await client.sendRequest<{ data: R, extensions?: any, errors?: any }>(query, {
					variables,
					apiTokenOverride: apiToken,
					headers,
				})
				setState({
					...response,
					state: 'success',
				})
				return response.data

			} catch (e) {
				setState({
					state: 'error',
				})
				throw e
			}
		},
		[client, query, apiToken, headers],
	)
	return [cb, state]
}
