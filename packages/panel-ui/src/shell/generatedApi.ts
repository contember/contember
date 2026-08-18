import type { GraphQlClient } from '@contember/graphql-client'
import { type Fetcher, TextWriter, util } from 'graphql-ts-client-api'
import { useCallback } from 'react'

export type FetcherExecutor = <TData extends object, TVariables extends object>(
	fetcher: Fetcher<'Query' | 'Mutation', TData, TVariables>,
	options?: { readonly variables?: TVariables },
) => Promise<TData>

/**
 * Runs a fetcher from a generated client (`graphql-client-system`, `graphql-client-actions`) against
 * a plain GraphQL client.
 *
 * The tenant API gets this from `useTenantApi`; system and actions have no hook package of their
 * own, so the panel writes the same document here rather than in every module.
 */
export const useFetcherExecutor = (client: GraphQlClient): FetcherExecutor =>
	useCallback((fetcher, options) => {
		const writer = new TextWriter()
		writer.text(fetcher.fetchableType.name.toLowerCase())
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

		return client.execute(writer.toString(), { variables: options?.variables })
	}, [client])
