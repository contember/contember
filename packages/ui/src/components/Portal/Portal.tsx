import { memo } from 'react'
import { createPortal } from 'react-dom'
import { usePortalProvider } from './contexts'
import { PortalProps } from './types'

/**
 * @group UI
 *
 * Portal is a component to render its children into a different part of the DOM.
 *
 * It is useful for rendering modals, popovers, tooltips, etc and must be used
 * together with `PortalProvider`.
 *
 * @param children - React children to render into the portal
 * @param to - optional `HTMLElement`, the portal container
 * @see usePortalProvider
 * @see PortalProvider
 */
export const Portal = memo(({ children, to }: PortalProps) => {
	const portalContainer = usePortalProvider()
	return createPortal(children, to ?? portalContainer)
})
Portal.displayName = 'Interface.Portal'
