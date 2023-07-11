import { deprecate } from '@contember/utilities'
import { DEFAULT_PORTAL_ROOT_ID, PortalProvider, usePortalProvider } from '../components'

/**
 * @deprecated use `usePortalProvider()` instead
 * @see usePortalProvider
 * @see PortalProvider
 * @see DEFAULT_PORTAL_ROOT_ID
 */
export function getPortalRoot(): HTMLElement {
	deprecate('1.3.0', false, 'getPortalRoot()', 'usePortalProvider()')

	return document.getElementById(DEFAULT_PORTAL_ROOT_ID) ?? document.body
}
