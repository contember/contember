import { ComponentType, MouseEvent as ReactMouseEvent, ReactNode } from 'react'

export interface InnerLinkProps  {
	href?: string
	onClick?: (e?: ReactMouseEvent<HTMLAnchorElement>) => void
}

export type LinkComponentProps = {
	entityName: string
	entityId: string | number
	action: 'edit' | 'view'
	Component?: ComponentType<InnerLinkProps>
	children: ReactNode
}

export type LinkComponent = ComponentType<LinkComponentProps>
