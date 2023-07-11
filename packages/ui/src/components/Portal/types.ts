import { PropsWithChildren, ReactNode } from 'react'

export type PortalRootProviderProps = PropsWithChildren<{ id: string }>

export type PortalRootProps = {
	id?: string
	displayContents?: boolean
}

export interface PortalProps {
	children: ReactNode
	to?: HTMLElement
}
