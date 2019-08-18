import * as React from 'react'
import cn from 'classnames'
import { Default, Size, ValidationState } from '../../types'
import { toViewClass } from '../../utils'

export interface ValidationMessageProps {
	type: Exclude<ValidationState, Default>
	size?: Size
	children?: React.ReactNode
}

export const ValidationMessage = React.memo(({ children, size, type }: ValidationMessageProps) => (
	<div className={cn('validationMessage', toViewClass(size), toViewClass(type))}>{children}</div>
))
