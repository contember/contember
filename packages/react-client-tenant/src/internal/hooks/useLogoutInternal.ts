import { useSetSessionToken } from '@contember/react-client'
import { useCallback } from 'react'
import { signOutMutation, useTenantApi } from '../../hooks/index.js'

export const useLogoutInternal = (clearIdentity?: () => void) => {
	const tenantApi = useTenantApi()
	const setSessionToken = useSetSessionToken()

	return useCallback(
		async ({ noRedirect = false, idpLogout = false }: { noRedirect?: boolean; idpLogout?: boolean } = {}) => {
			if (navigator.credentials?.preventSilentAccess) {
				try {
					await navigator.credentials.preventSilentAccess()
				} catch {
					// actually, not implemented in safari:
					// https://github.com/WebKit/WebKit/blob/414f4e45b0e82bbfcee783d08a9642be1afa8f72/Source/WebCore/Modules/credentialmanagement/CredentialsContainer.cpp#L132
				}
			}
			clearIdentity?.()
			setSessionToken(undefined)
			// RP-initiated (front-channel) Single Logout: when the session was federated via an OIDC
			// IdP that advertises an end_session_endpoint, `signOut` returns the URL to send the
			// browser to so the user is also signed out at the IdP. Opt-in via `idpLogout` — by
			// default we keep the existing local-only redirect to `/`. We call the tenant API
			// directly (not useSignOutMutation) because the generic mutation wrapper only surfaces a
			// `result` payload, whereas `logoutUrl` is a top-level field on SignOutResponse.
			let idpLogoutUrl: string | undefined
			try {
				const { mutation } = await tenantApi(signOutMutation)
				if (!mutation?.ok) {
					console.warn(mutation?.error)
				}
				if (idpLogout) {
					idpLogoutUrl = mutation?.logoutUrl ?? undefined
				}
			} catch (e) {
				console.warn(e)
			}
			if (!noRedirect) {
				window.location.href = idpLogoutUrl ?? '/' // todo better redirect?
			}
		},
		[clearIdentity, setSessionToken, tenantApi],
	)
}
