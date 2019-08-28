import * as React from 'react'
import cn from 'classnames'
import { Size } from '../../types'
import { toEnumViewClass, toViewClass } from '../../utils'

export interface ButtonGroupProps {
	children?: React.ReactNode
	size?: Size
	isTopToolbar?: boolean
}

export const ButtonGroup = React.memo(({ size, isTopToolbar, children }: ButtonGroupProps) => (
	<div className={cn('button-group', toEnumViewClass(size), toViewClass('isTopToolbar', isTopToolbar))} role="group">
		{children}
	</div>
))
ButtonGroup.displayName = 'ButtonGroup'
