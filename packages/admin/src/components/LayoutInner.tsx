import { Box } from '@contember/ui'
import * as React from 'react'

export const LayoutInner = React.memo(({ children }) => <div className="layout-content-in">{children}</div>)

export const LayoutSide = React.memo(({ children }) => (
	<div className="layout-content-side">
		<Box>{children}</Box>
	</div>
))
