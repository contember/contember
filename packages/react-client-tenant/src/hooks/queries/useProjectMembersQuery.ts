import * as TenantApi from '@contember/graphql-client-tenant'
import { ModelType, ParameterRef } from 'graphql-ts-client-api'
import { TenantApiOptions, useTenantApi } from '../useTenantApi'
import { useCallback } from 'react'

const projectIdentityRelationFragment = TenantApi
	.projectIdentityRelation$
	.identity(TenantApi.identity$$
		.person(TenantApi.person$.id.email.name.otpEnabled)
		.apiKey(TenantApi.apiKey$$)
		,
	)
	.memberships(TenantApi.membership$$.variables(TenantApi.variableEntry$$))

export type ProjectMembersQueryResult = readonly ModelType<typeof projectIdentityRelationFragment>[]

export type ProjectMembersQueryVariables =
	& {
		projectSlug: string
	}
	& TenantApi.ProjectMembersInput


export const useProjectMembersQuery = ({ headers, apiToken }: TenantApiOptions = {}) => {
	const executor = useTenantApi({
		headers,
		apiToken,
	})
	return useCallback(async ({ projectSlug, ...membersInput }: ProjectMembersQueryVariables): Promise<ProjectMembersQueryResult> => {
		const result = await executor(TenantApi.query$.projectBySlug({
			slug: ParameterRef.of('projectSlug'),
		}, TenantApi.project$.members({
			input: ParameterRef.of('membersInput'),
		}, projectIdentityRelationFragment)), {
			variables: {
				projectSlug,
				membersInput,
			},
		})

		return result.projectBySlug?.members ?? []
	}, [executor])
}
