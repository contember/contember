import * as tenant from '@contember/graphql-client-tenant'
import { ModelType } from 'graphql-ts-client-api'
import { useTenantExecutor } from './useTenantExecutor'
import { useCallback } from 'react'

const signOutFragment = tenant.signOutResponse$$.error(tenant.signOutError$$)

export type SignOutResult = ModelType<typeof signOutFragment>

export const useSignOut = () => {
	const executor = useTenantExecutor()
	return useCallback(async () => {
		return (await executor(tenant.mutation$.signOut(signOutFragment))).signOut
	}, [executor])
}
