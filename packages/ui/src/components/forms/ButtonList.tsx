import * as React from 'react'
import cn from 'classnames'
import { useComponentClassName } from '../../auxiliary'
import { ButtonListFlow } from '../../types'
import { toEnumViewClass } from '../../utils'

export interface ButtonListProps {
	children?: React.ReactNode
	flow?: ButtonListFlow
}

export const ButtonList = React.memo(({ children, flow }: ButtonListProps) => (
	<div className={cn(useComponentClassName('button-list'), toEnumViewClass(flow, 'inline'))} role="group">
		{children}
	</div>
))
ButtonList.displayName = 'ButtonList'
