import { memo, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { StyleProvider } from './StyleProvider'

export interface PortalProps {
	to?: HTMLElement
	children: ReactNode
}

export const Portal = memo((props: PortalProps) => createPortal(<StyleProvider>{props.children}</StyleProvider>, props.to ?? document.getElementById('portal-root') ?? document.body))
Portal.displayName = 'Portal'

export function getPortalRoot(): HTMLElement {
	return document.getElementById('portal-root') ?? document.body
}
