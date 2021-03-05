import { Box } from '@contember/ui'
import { memo } from 'react'

export const LayoutInner = memo(({ children }) => <div className="layout-content-in">{children}</div>)

export const LayoutSide = memo(({ children }) => (
	<div className="layout-content-side">
		<Box>{children}</Box>
	</div>
))
