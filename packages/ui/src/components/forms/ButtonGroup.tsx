import * as React from 'react'
import cn from 'classnames'
import { Size } from '../../types'
import { toViewClass } from '../../utils'

export interface ButtonGroupProps {
	children?: React.ReactNode
	size?: Size
}

export const ButtonGroup = React.memo(({ size, children }: ButtonGroupProps) => (
	<div className={cn('button-group', toViewClass(size))} role="group">
		{children}
	</div>
))
