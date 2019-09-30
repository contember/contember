import * as React from 'react'
import cn from 'classnames'
import { Default, Size, ValidationMessageFlow, ValidationState } from '../../types'
import { toEnumViewClass, toViewClass } from '../../utils'

export interface ValidationMessageProps {
	type: Exclude<ValidationState, Default>
	size?: Size
	flow?: ValidationMessageFlow
	framed?: boolean
	children?: React.ReactNode
}

export const ValidationMessage = React.memo(({ children, size, flow, type, framed }: ValidationMessageProps) => (
	<span
		className={cn(
			'validationMessage',
			toEnumViewClass(size),
			toEnumViewClass(type),
			toViewClass('framed', framed),
			toEnumViewClass(flow),
		)}
	>
		{children}
	</span>
))
ValidationMessage.displayName = 'ValidationMessage'
