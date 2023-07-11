import { ReactNode, memo, useRef } from 'react'
import { Portal } from './Portal'
import { DEFAULT_PORTAL_ROOT_ID } from './constants'
import { PortalProviderContext, usePortalProvider } from './contexts'

export interface PortalProviderProps {
	children: ReactNode
}

/**
 * @group UI
 *
 * PortalProvider is a container hosts a DOM element (a portal root container) where `<Portal>`
 * render its children.
 *
 * It is useful for rendering modals, popovers, tooltips, etc and must be used
 * together with `<Portal>` or with `usePortalProvider` hook.
 *
 * @param children - React children to render into the portal
 * @see usePortalProvider
 * @see Portal
 * @see PortalProviderContext
 * @see PortalProviderProps
 *
 * @example
 * ```tsx
 * import { PortalProvider } from '@contember/ui'
 *
 * const App = () => (
 * 	<PortalProvider>
 * 		<Portal>...</Portal>
 * 	</PortalProvider>
 * )
 * ```
 */
export const PortalProvider = memo((props: PortalProviderProps) => {
	const portalRootRef = useRef<HTMLDivElement>(null!)

	return (
		<>
			<PortalProviderContext.Provider value={portalRootRef}>
				{props.children}
			</PortalProviderContext.Provider>
			<div ref={portalRootRef} id={DEFAULT_PORTAL_ROOT_ID} style={{ display: 'contents' }} />
		</>
	)
})
PortalProvider.displayName = 'Interface.PortalProvider'
