import * as TenantApi from '@contember/graphql-client-tenant'
import { ModelType, ParameterRef } from 'graphql-ts-client-api'
import { TenantApiOptions, useTenantApi } from '../useTenantApi.js'
import { useCallback } from 'react'

const apiKeyFragment = TenantApi
	.apiKey$$
	.identity(
		TenantApi.identity$$
			.projects(
				TenantApi
					.identityProjectRelation$
					.project(TenantApi.project$$)
					.memberships(TenantApi.membership$$.variables(TenantApi.variableEntry$$)),
			),
	)

export type ProjectApiKeysQueryResult = readonly ModelType<typeof apiKeyFragment>[]

export type ProjectApiKeysQueryVariables = {
	projectSlug: string
}

export const useProjectApiKeysQuery = (options: TenantApiOptions = {}) => {
	const executor = useTenantApi(options)
	return useCallback(async ({ projectSlug }: ProjectApiKeysQueryVariables): Promise<ProjectApiKeysQueryResult> => {
		const result = await executor(
			TenantApi.query$.projectBySlug(
				{
					slug: ParameterRef.of('projectSlug'),
				},
				TenantApi.project$.apiKeys(apiKeyFragment),
			),
			{
				variables: {
					projectSlug,
				},
			},
		)

		return result.projectBySlug?.apiKeys ?? []
	}, [executor])
}
