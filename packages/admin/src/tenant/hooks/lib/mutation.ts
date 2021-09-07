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
		async (variables: V) => {
			setState({
				loading: true,
				finished: false,
				error: false,
			})
			try {
				const response = await client.sendRequest<{ data: R, extensions?: any, errors?: any }>(query, {
					variables,
					apiTokenOverride: apiToken,
					headers,
				})
				setState({
					...response,
					loading: false,
					finished: true,
					error: false,
				})
				return response.data

			} catch (e) {
				setState({
					loading: false,
					finished: true,
					error: true,
				})
				throw e
			}
		},
		[client, query, apiToken, headers],
	)
	return [cb, state]
}
