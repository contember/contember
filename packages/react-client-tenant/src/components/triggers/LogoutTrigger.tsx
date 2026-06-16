import { ReactNode, useCallback } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { useLogout } from '../../hooks/useLogout.js'

export const LogoutTrigger = ({ children, idpLogout }: {
	children: ReactNode
	/**
	 * Opt in to OIDC front-channel Single Logout: when the session was federated via an OIDC IdP
	 * that advertises an end_session_endpoint, redirect the browser to the IdP's logout URL so the
	 * user is also signed out at the IdP. Defaults to a local-only logout.
	 */
	idpLogout?: boolean
}) => {
	const logout = useLogout()
	return <Slot onClick={useCallback(() => logout({ idpLogout }), [logout, idpLogout])}>{children}</Slot>
}
