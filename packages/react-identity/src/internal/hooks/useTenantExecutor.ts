import { execute } from '@contember/graphql-client-tenant'
import { useTenantGraphQlClient } from '@contember/react-client'
import { useCallback } from 'react'
import type { Fetcher } from 'graphql-ts-client-api'

export const useTenantExecutor = () => {
	const client = useTenantGraphQlClient()

	return useCallback(<TData extends object, TVariables extends object>(
		fetcher: Fetcher<'Query' | 'Mutation', TData, TVariables>,
		options?: {
			readonly operationName?: string
			readonly variables?: TVariables
			readonly headers?: Record<string, string>
			readonly apiTokenOverride?: string
		},
	): Promise<TData> => {

		return execute(fetcher, {
			...options,
			executor: async (request, variables) => {
				return await client.sendRequest(request, {
					variables,
					headers: options?.headers,
					apiTokenOverride: options?.apiTokenOverride,
				})
			},
		})
	}, [client])
}
