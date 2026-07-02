import * as TenantApi from '@contember/graphql-client-tenant'
import { ModelType, ParameterRef } from 'graphql-ts-client-api'
import { TenantApiOptions, useTenantApi } from '../useTenantApi.js'
import { useCallback } from 'react'

const personFragment = TenantApi
	.person$$
	.identity(TenantApi.identity$$)

export type PersonsQueryResult = readonly ModelType<typeof personFragment>[]

export type PersonsQueryVariables = {
	filter?: TenantApi.PersonsFilter
	limit?: number
	offset?: number
}

export const usePersonsQuery = (options: TenantApiOptions = {}) => {
	const executor = useTenantApi(options)
	return useCallback(async (variables: PersonsQueryVariables = {}): Promise<PersonsQueryResult> => {
		const result = await executor(
			TenantApi.query$.persons(
				{
					filter: ParameterRef.of('filter'),
					limit: ParameterRef.of('limit'),
					offset: ParameterRef.of('offset'),
				},
				personFragment,
			),
			{
				variables,
			},
		)

		return result.persons ?? []
	}, [executor])
}
