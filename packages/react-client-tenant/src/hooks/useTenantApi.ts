import { execute } from '@contember/graphql-client-tenant'
import { useTenantGraphQlClient } from '@contember/react-client'
import { useCallback } from 'react'
import type { Fetcher } from 'graphql-ts-client-api'

export const useTenantApi = () => {
	const client = useTenantGraphQlClient()

	return useCallback(<TData extends object, TVariables extends object>(
		fetcher: Fetcher<'Query' | 'Mutation', TData, TVariables>,
		options?: {
			readonly variables?: TVariables
			readonly headers?: Record<string, string>
			readonly apiToken?: string
		},
	): Promise<TData> => {

		return execute(fetcher, {
			...options,
			executor: async (request, variables) => {
				return await client.execute(request, {
					variables,
					headers: options?.headers,
					apiToken: options?.apiToken,
				})
			},
		})
	}, [client])
}
