import { useLogout } from '@contember/react-client-tenant'
import { useCallback } from 'react'

/**
 * Signs out without leaving the panel. `useLogout` sends the browser to `/` by default, which is
 * the application root, not the panel's. Clears the panel's own session key — see `PanelClient`.
 */
export const useSignOut = (): () => void => {
	const logout = useLogout()
	return useCallback(() => void logout({ noRedirect: true }), [logout])
}
