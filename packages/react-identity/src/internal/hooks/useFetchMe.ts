import * as TenantApi from '@contember/react-client-tenant'
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

export type FetchedIdentity = TenantApi.ModelType<typeof identityFragment>

export const useFetchMe = () => {
	const executor = TenantApi.useTenantApi()
	return useCallback(async () => {
		return (await executor(TenantApi.query$.me(identityFragment))).me
	}, [executor])
}
