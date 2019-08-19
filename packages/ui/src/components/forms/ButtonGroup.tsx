import * as React from 'react'
import cn from 'classnames'
import { Size } from '../../types'
import { toEnumViewClass } from '../../utils'

export interface ButtonGroupProps {
	children?: React.ReactNode
	size?: Size
}

export const ButtonGroup = React.memo(({ size, children }: ButtonGroupProps) => (
	<div className={cn('button-group', toEnumViewClass(size))} role="group">
		{children}
	</div>
))
