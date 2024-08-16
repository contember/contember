import { useSetSessionToken } from '@contember/react-client'
import { useCallback } from 'react'
import { useSignOutMutation } from '../../hooks'

export const useLogoutInternal = (clearIdentity?: () => void) => {
	const tenantLogout = useSignOutMutation()
	const setSessionToken = useSetSessionToken()

	return useCallback(
		async ({ noRedirect = false }: { noRedirect?: boolean } = {}) => {
			if (navigator.credentials && navigator.credentials.preventSilentAccess) {
				try {
					await navigator.credentials.preventSilentAccess()
				} catch {
					// actually, not implemented in safari:
					// https://github.com/WebKit/WebKit/blob/414f4e45b0e82bbfcee783d08a9642be1afa8f72/Source/WebCore/Modules/credentialmanagement/CredentialsContainer.cpp#L132
				}
			}
			clearIdentity?.()
			setSessionToken(undefined)
			try {
				const response = await tenantLogout({})
				if (!response?.ok) {
					console.warn(response?.error)
				}
			} catch (e) {
				console.warn(e)
			}
			if (!noRedirect) {
				window.location.href = '/' // todo better redirect?
			}
		},
		[clearIdentity, setSessionToken, tenantLogout],
	)
}
