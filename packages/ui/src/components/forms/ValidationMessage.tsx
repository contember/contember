import * as React from 'react'
import cn from 'classnames'
import { Default, Size, ValidationState } from '../../types'
import { toEnumViewClass } from '../../utils'

export interface ValidationMessageProps {
	type: Exclude<ValidationState, Default>
	size?: Size
	children?: React.ReactNode
}

export const ValidationMessage = React.memo(({ children, size, type }: ValidationMessageProps) => (
	<span className={cn('validationMessage', toEnumViewClass(size), toEnumViewClass(type))}>{children}</span>
))
ValidationMessage.displayName = 'ValidationMessage'
