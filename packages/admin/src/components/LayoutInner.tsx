import { Box } from '@contember/ui'
import { ReactNode } from 'react'

export const LayoutContent = ({ children }: { children: ReactNode }) => <div className="layout-content">{children}</div>

export const LayoutInner = ({ children }: { children: ReactNode }) => (
	<div className="layout-content-in">{children}</div>
)

export const LayoutSide = ({ children }: { children: ReactNode }) => (
	<div className="layout-content-side">
		<Box>{children}</Box>
	</div>
)
