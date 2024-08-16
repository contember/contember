import * as TenantApi from '@contember/graphql-client-tenant'
import { ModelType } from 'graphql-ts-client-api'
import { TenantApiOptions, useTenantApi } from '../useTenantApi'
import { useCallback } from 'react'

const projectRolesDefinitionFragment = TenantApi.roleDefinition$$
	.variables(
		TenantApi.roleVariableDefinition$$
			.on(TenantApi.roleConditionVariableDefinition$$)
			.on(TenantApi.roleEntityVariableDefinition$$)
			.on(TenantApi.rolePredefinedVariableDefinition$$)
		,
	)

export type ProjectRoleDefinition = ModelType<typeof projectRolesDefinitionFragment>
export type ProjectRolesDefinitionQueryResult = readonly ProjectRoleDefinition[]

const projectRolesDefinitionQuery = TenantApi.query$
	.projectBySlug(
		TenantApi
			.project$
			.roles(projectRolesDefinitionFragment),
	)

export interface ProjectRolesDefinitionQueryVariables {
	slug: string
}

export const useProjectRolesDefinitionQuery = ({ headers, apiToken }: TenantApiOptions = {}) => {
	const executor = useTenantApi()
	return useCallback(async (variables: ProjectRolesDefinitionQueryVariables): Promise<ProjectRolesDefinitionQueryResult> => {
		return (await executor(projectRolesDefinitionQuery, { headers, apiToken, variables })).projectBySlug?.roles ?? []
	}, [apiToken, executor, headers])
}
