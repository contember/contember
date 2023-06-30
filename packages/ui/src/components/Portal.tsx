import { memo, ReactNode } from 'react'
import { createPortal } from 'react-dom'

export interface PortalProps {
	to?: HTMLElement
	children: ReactNode
}

export const Portal = memo((props: PortalProps) => createPortal(
	props.children,
	props.to ?? document.getElementById('portal-root') ?? document.body,
))
Portal.displayName = 'Portal'

export function getPortalRoot(): HTMLElement {
	return document.getElementById('portal-root') ?? document.body
}
