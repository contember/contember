import { Stack } from '@contember/ui'
import type { ReactNode } from 'react'

export const LayoutContent = ({ children }: { children: ReactNode }) => (
	<div className="layout-content">{children}</div>
)

export const LayoutInner = ({ children }: { children: ReactNode }) => (
	<Stack direction="vertical" className="layout-content-in">{children}</Stack>
)

export const LayoutSide = ({ children }: { children: ReactNode }) => (
	<div className="layout-content-side">
		<Stack depth={2} direction="vertical">
			{children}
		</Stack>
	</div>
)
