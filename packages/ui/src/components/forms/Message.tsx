import cn from 'classnames'
import * as React from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import { MessageDistinction, MessageFlow, MessageType, Size } from '../../types'
import { toEnumViewClass, toViewClass } from '../../utils'

export interface MessageProps {
	type?: MessageType
	size?: Size
	flow?: MessageFlow
	distinction?: MessageDistinction
	lifted?: boolean
	children?: React.ReactNode
	action?: React.ReactNode
}

export const Message = React.memo(({ children, size, flow, distinction, type, lifted, action }: MessageProps) => {
	const prefix = useClassNamePrefix()
	return (
		<div
			className={cn(
				`${prefix}message`,
				toEnumViewClass(size),
				toEnumViewClass(type),
				toEnumViewClass(distinction),
				toViewClass('lifted', lifted),
				toEnumViewClass(flow),
			)}
		>
			<div className={`${prefix}message-content`}>{children}</div>
			{action && <div className={`${prefix}message-action`}>{action}</div>}
		</div>
	)
})
Message.displayName = 'Message'
