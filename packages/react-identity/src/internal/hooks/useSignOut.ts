import * as TenantApi from '@contember/graphql-client-tenant'
import { ModelType, useTenantApi } from '@contember/react-client-tenant'
import { useCallback } from 'react'

const signOutFragment = TenantApi.signOutResponse$$.error(TenantApi.signOutError$$)

export type SignOutResult = ModelType<typeof signOutFragment>

export const useSignOut = () => {
	const api = useTenantApi()
	return useCallback(async () => {
		return (await api(TenantApi.mutation$.signOut(signOutFragment))).signOut
	}, [api])
}
