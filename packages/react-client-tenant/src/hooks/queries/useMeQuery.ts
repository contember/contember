import * as TenantApi from '@contember/graphql-client-tenant'
import { ModelType } from 'graphql-ts-client-api'
import { TenantApiOptions, useTenantApi } from '../useTenantApi'
import { useCallback } from 'react'

const identityFragment = TenantApi
	.identity$$
	.person(TenantApi.person$$)
	.projects(TenantApi
		.identityProjectRelation$
		.project(TenantApi.project$$)
		.memberships(TenantApi.membership$$.variables(TenantApi.variableEntry$$)),
	)
	.permissions(TenantApi.identityGlobalPermissions$$)

export type MeQueryData = ModelType<typeof identityFragment>

export const useMeQuery = (options: TenantApiOptions = {}) => {
	const executor = useTenantApi(options)
	return useCallback(async ({}: {}): Promise<MeQueryData> => {
		return (await executor(TenantApi.query$.me(identityFragment))).me
	}, [executor])
}
