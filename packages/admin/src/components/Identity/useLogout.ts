import { useCallback, useContext } from 'react'
import { IdentityContext } from './IdentityProvider'
import { useSignOut as useTenantLogout } from '../../tenant/hooks/signOut'
import { useShowToast } from '../Toaster'

export const useLogout = () => {
	const ctx = useContext(IdentityContext)
	const [tenantLogout] = useTenantLogout()
	const logout = ctx?.clearIdentity
	const toaster = useShowToast()
	return useCallback(async () => {
		if (!logout) {
			throw new Error('Identity context is not initialized')
		}
		logout()
		const response = await tenantLogout({})
		if (!response.signOut.ok) {
			console.warn(response.signOut.error)
			toaster({
				message: response.signOut.error?.endUserMessage ?? 'Failed to logout',
				type: 'error',
			})
		}
		window.location.href = '/' // todo better redirect?
	}, [logout, tenantLogout, toaster])
}
