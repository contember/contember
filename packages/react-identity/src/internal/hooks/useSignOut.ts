import * as TenantApi from '@contember/react-client-tenant'
import { useCallback } from 'react'

const signOutFragment = TenantApi.signOutResponse$$.error(TenantApi.signOutError$$)

export type SignOutResult = TenantApi.ModelType<typeof signOutFragment>

export const useSignOut = () => {
	const api = TenantApi.useTenantApi()
	return useCallback(async () => {
		return (await api(TenantApi.mutation$.signOut(signOutFragment))).signOut
	}, [api])
}
