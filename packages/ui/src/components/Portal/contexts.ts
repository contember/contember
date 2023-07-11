import { MutableRefObject, createContext, useContext } from 'react'
import { Portal } from './Portal'
import { PortalProvider } from './PortalProvider'

/**
 * @group UI
 *
 * Context for `<PortalProvider>` component.
 * @see PortalProvider
 *
 */
export const PortalProviderContext = createContext<MutableRefObject<HTMLDivElement>>(null!)
PortalProviderContext.displayName = 'Interface.PortalProviderContext'

/**
 * @group UI
 *
 * Hook to get the current portal provider element. This is used internally by `<Portal>` component.
 *
 * @param override - If provided, this will be returned instead of the context value.
 * @returns The current portal provider element.
 *
 * @see Portal
 * @see PortalProvider
 * @see PortalProviderContext
 *
 * @example
 * ```tsx
 * const portalProvider = usePortalProvider()
 * ```
 *
 * @example
 * ```tsx
 * const portalProvider = usePortalProvider(document.getElementById('portal-provider'))
 * ```
 */
export function usePortalProvider(override?: HTMLElement) {
	const context = useContext(PortalProviderContext)

	if (override) {
		return override
	} else {
		if (!context) {
			throw new Error('`usePortalProvider()` must be used within a `<PortalProvider>`, specifically within a `<PortalProviderContext.Provider>`')
		}

		return context.current
	}
}
