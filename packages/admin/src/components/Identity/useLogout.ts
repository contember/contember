import { useCallback, useContext } from 'react'
import { IdentityContext } from './IdentityProvider'
import { useSignOut as useTenantLogout } from '../../tenant/hooks/signOut'
import { useShowToast } from '../Toaster'

export const useLogout = () => {
	const ctx = useContext(IdentityContext)
	const [tenantLogout] = useTenantLogout()
	const logout = ctx?.clearIdentity
	const toaster = useShowToast()

	return useCallback(
		async () => {
			if (navigator.credentials && navigator.credentials.preventSilentAccess) {
				try {
					await navigator.credentials.preventSilentAccess()
				} catch {
					// actually, not implemented in safari:
					// https://github.com/WebKit/WebKit/blob/414f4e45b0e82bbfcee783d08a9642be1afa8f72/Source/WebCore/Modules/credentialmanagement/CredentialsContainer.cpp#L132
				}
			}
			logout?.()

			const response = await tenantLogout({})
			if (!response.signOut.ok) {
				console.warn(response.signOut.error)
				toaster({
					message: response.signOut.error?.endUserMessage ?? 'Failed to logout',
					type: 'error',
				})
			}

			window.location.href = '/' // todo better redirect?
		},
		[logout, tenantLogout, toaster],
	)
}
