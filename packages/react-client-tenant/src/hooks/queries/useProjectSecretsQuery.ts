import * as TenantApi from '@contember/graphql-client-tenant'
import { ModelType, ParameterRef } from 'graphql-ts-client-api'
import { TenantApiOptions, useTenantApi } from '../useTenantApi.js'
import { useCallback } from 'react'

const projectSecretFragment = TenantApi.projectSecretInfo$$

export type ProjectSecretsQueryResult = readonly ModelType<typeof projectSecretFragment>[]

export type ProjectSecretsQueryVariables = {
	projectSlug: string
}

export const useProjectSecretsQuery = (options: TenantApiOptions = {}) => {
	const executor = useTenantApi(options)
	return useCallback(async ({ projectSlug }: ProjectSecretsQueryVariables): Promise<ProjectSecretsQueryResult> => {
		const result = await executor(
			TenantApi.query$.projectBySlug(
				{
					slug: ParameterRef.of('projectSlug'),
				},
				TenantApi.project$.secrets(projectSecretFragment),
			),
			{
				variables: {
					projectSlug,
				},
			},
		)

		return result.projectBySlug?.secrets ?? []
	}, [executor])
}
