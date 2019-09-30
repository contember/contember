import * as React from 'react'
import cn from 'classnames'
import { Default, Size, ValidationMessageFlow, ValidationState } from '../../types'
import { toEnumViewClass, toViewClass } from '../../utils'

export interface ValidationMessageProps {
	type: Exclude<ValidationState, Default>
	size?: Size
	flow?: ValidationMessageFlow
	framed?: boolean
	lifted?: boolean
	children?: React.ReactNode
	action?: React.ReactNode
}

export const ValidationMessage = React.memo(
	({ children, size, flow, type, framed, lifted, action }: ValidationMessageProps) => (
		<div
			className={cn(
				'validationMessage',
				toEnumViewClass(size),
				toEnumViewClass(type),
				toViewClass('framed', framed),
				toViewClass('lifted', lifted),
				toEnumViewClass(flow),
			)}
		>
			<div className="validationMessage-content">{children}</div>
			{action && <div className="validationMessage-action">{action}</div>}
		</div>
	),
)
ValidationMessage.displayName = 'ValidationMessage'
