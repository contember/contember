import { ModelType, TenantApi, useTenantApi } from '@contember/react-client-tenant'
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

export type FetchedIdentity = ModelType<typeof identityFragment>

export const useFetchMe = () => {
	const executor = useTenantApi()
	return useCallback(async () => {
		return (await executor(TenantApi.query$.me(identityFragment))).me
	}, [executor])
}
