import * as React from 'react'
import ReactDOM from 'react-dom'

export interface PortalProps {
	to?: HTMLElement
	children: React.ReactNode
}

export const Portal = React.memo((props: PortalProps) =>
	ReactDOM.createPortal(props.children, props.to ?? document.body),
)
Portal.displayName = 'Portal'
