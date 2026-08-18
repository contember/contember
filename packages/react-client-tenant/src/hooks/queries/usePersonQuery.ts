import * as TenantApi from '@contember/graphql-client-tenant'
import { ModelType, ParameterRef } from 'graphql-ts-client-api'
import { TenantApiOptions, useTenantApi } from '../useTenantApi.js'
import { useCallback } from 'react'

const personFragment = TenantApi.person$$
	.identity(
		TenantApi.identity$$
			.projects(
				TenantApi
					.identityProjectRelation$
					.project(TenantApi.project$$)
					.memberships(TenantApi.membership$$.variables(TenantApi.variableEntry$$)),
			)
			.sessions(TenantApi.sessionInfo$$),
	)
	.identityProviders(TenantApi.personIdentityProvider$$.identityProvider(TenantApi.identityProviderListItem$$))

export type PersonQueryResult = ModelType<typeof personFragment> | null

export type PersonQueryVariables = {
	personId: string
}

export const usePersonQuery = (options: TenantApiOptions = {}) => {
	const executor = useTenantApi(options)
	return useCallback(async ({ personId }: PersonQueryVariables): Promise<PersonQueryResult> => {
		const result = await executor(
			TenantApi.query$.personById({ id: ParameterRef.of('personId') }, personFragment),
			{ variables: { personId } },
		)

		return result.personById ?? null
	}, [executor])
}
