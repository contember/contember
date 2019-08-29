import * as React from 'react'

export interface ButtonListProps {
	children?: React.ReactNode
}

export const ButtonList = React.memo(({ children }: ButtonListProps) => (
	<div className="button-list" role="group">
		{children}
	</div>
))
ButtonList.displayName = 'ButtonList'
