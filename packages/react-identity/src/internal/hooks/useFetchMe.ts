import * as tenant from '@contember/graphql-client-tenant'
import { useCallback } from 'react'
import { ModelType } from 'graphql-ts-client-api'
import { useTenantExecutor } from './useTenantExecutor'

const identityFragment = tenant
	.identity$$
	.person(tenant.person$$)
	.projects(tenant
		.identityProjectRelation$
		.project(tenant.project$$)
		.memberships(tenant.membership$$.variables(tenant.variableEntry$$)),
	)
	.permissions(tenant.identityGlobalPermissions$$)

export type FetchedIdentity = ModelType<typeof identityFragment>

export const useFetchMe = () => {
	const executor = useTenantExecutor()
	return useCallback(async () => {
		return (await executor(tenant.query$.me(identityFragment))).me
	}, [executor])
}
