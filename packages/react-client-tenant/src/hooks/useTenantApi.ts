import { useLoginToken, useTenantGraphQlClient } from '@contember/react-client'
import { useCallback } from 'react'
import { Fetcher, TextWriter, util } from 'graphql-ts-client-api'

export const LoginToken = Symbol('LoginToken')

export type TenantApiOptions = {
	readonly headers?: Record<string, string>
	readonly apiToken?: string | typeof LoginToken
}

export const useTenantApi = ({ headers, apiToken }: TenantApiOptions = {}) => {
	const client = useTenantGraphQlClient()
	const loginToken = useLoginToken()

	return useCallback(<TData extends object, TVariables extends object>(
		fetcher: Fetcher<'Query' | 'Mutation', TData, TVariables>,
		options?: {
			readonly variables?: TVariables
			readonly headers?: Record<string, string>
			readonly apiToken?: string | typeof LoginToken
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

		const apiTokenResolved = apiToken ?? options?.apiToken
		return client.execute(writer.toString(), {
			variables: options?.variables,
			headers: {
				...headers,
				...options?.headers,
			},
			apiToken: apiTokenResolved === LoginToken ? loginToken : apiTokenResolved,
		})
	}, [apiToken, client, headers, loginToken])
}
