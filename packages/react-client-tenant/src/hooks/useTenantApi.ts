import { useTenantGraphQlClient } from '@contember/react-client'
import { useCallback } from 'react'
import { Fetcher, TextWriter, util } from 'graphql-ts-client-api'

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

		const writer = new TextWriter()
		writer.text(`${fetcher.fetchableType.name.toLowerCase()}`)
		if (fetcher.variableTypeMap.size !== 0) {
			writer.scope({ type: 'ARGUMENTS', multiLines: fetcher.variableTypeMap.size > 2, suffix: ' ' }, () => {
				util.iterateMap(fetcher.variableTypeMap, ([name, type]) => {
					writer.seperator()
					writer.text(`$${name}: ${type}`)
				})
			})
		}
		writer.text(fetcher.toString())
		writer.text(fetcher.toFragmentString())

		return client.execute(writer.toString(), {
			variables: options?.variables,
			headers: options?.headers,
			apiToken: options?.apiToken,
		})
	}, [client])
}
