import { Box } from '@contember/ui'
import * as React from 'react'

export const LayoutInner: React.FC<{}> = ({ children }) => {
	return <div className="layout-content-in">{children}</div>
}

export interface LayoutSideProps {
	showBox?: boolean
}

export const LayoutSide: React.FC<LayoutSideProps> = ({ children, showBox }) => {
	return (
		<div className="layout-content-side">
			{showBox && <Box>{children}</Box>}
			{showBox || children}
		</div>
	)
}
