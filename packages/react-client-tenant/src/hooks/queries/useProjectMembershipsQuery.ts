import * as TenantApi from '@contember/graphql-client-tenant'
import { ModelType, ParameterRef } from 'graphql-ts-client-api'
import { TenantApiOptions, useTenantApi } from '../useTenantApi'
import { useCallback } from 'react'

const projectMembershipsFragment = TenantApi.membership$$.variables(TenantApi.variableEntry$$)

export type ProjectMembershipsQueryResult = readonly ModelType<typeof projectMembershipsFragment>[]

export type ProjectMembershipsQueryVariables = {
	projectSlug: string
	identityId: string
}


export const useProjectMembershipsQuery = (options: TenantApiOptions = {}) => {
	const executor = useTenantApi(options)
	return useCallback(async (input: ProjectMembershipsQueryVariables): Promise<ProjectMembershipsQueryResult> => {
		const result = await executor(TenantApi.query$.projectMemberships(TenantApi.membership$$.variables(TenantApi.variableEntry$$)), {
			variables: input,
		})

		return result.projectMemberships ?? []
	}, [executor])
}
